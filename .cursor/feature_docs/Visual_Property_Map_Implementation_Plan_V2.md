# Implementation Plan — Visual Property Map (Image Overlay Approach)
**Property Management System (FYP)**
**Version:** 2.0 | **Stack:** React 18 + TypeScript + Spring Boot 3

---

## Approach Summary

The admin uploads a **floor plan image** (JPG/PNG) per floor. Unit overlays are positioned on top of that image using percentage-based coordinates stored in the database. No SVG conversion. No third-party library. Occupied units are darkened via CSS. Available units are clickable.

```
┌──────────────────────────────────┐
│  Floor Plan Image (background)   │
│  ┌────────┐   ┌────────┐         │
│  │  A1    │   │  A2    │  ← div  │
│  │ (green)│   │(blacked│  overlays│
│  └────────┘   └────────┘         │
└──────────────────────────────────┘
Coordinates stored as % of image dimensions.
Renders via CSS position:absolute over position:relative container.
```

---

## Step 1 — Database Schema

**File:** `V1__visual_map_schema.sql`

```sql
-- Stores uploaded floor plan images per floor
CREATE TABLE floor_plan (
    id           BIGINT AUTO_INCREMENT PRIMARY KEY,
    floor_id     BIGINT NOT NULL REFERENCES floor(id) ON DELETE CASCADE,
    image_path   VARCHAR(500) NOT NULL,       -- server file path or storage key
    image_width  INT NOT NULL,                -- original image width in px (for reference)
    image_height INT NOT NULL,               -- original image height in px (for reference)
    uploaded_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (floor_id)                         -- one plan per floor
);

-- Stores each unit's overlay position as % of image size
CREATE TABLE unit_overlay (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    unit_id     BIGINT NOT NULL REFERENCES unit(id) ON DELETE CASCADE,
    x_pct       DECIMAL(6,3) NOT NULL,   -- left edge as % of image width  (e.g. 12.500)
    y_pct       DECIMAL(6,3) NOT NULL,   -- top  edge as % of image height (e.g. 8.250)
    w_pct       DECIMAL(6,3) NOT NULL,   -- overlay width  as % of image width
    h_pct       DECIMAL(6,3) NOT NULL,   -- overlay height as % of image height
    UNIQUE (unit_id)
);

-- Core unit table (unchanged from existing schema, status column is key)
-- unit: id, floor_id, unit_number, bedrooms, size_m2, monthly_rent,
--       status ENUM('AVAILABLE','OCCUPIED') DEFAULT 'AVAILABLE'
```

> **Why percentages?** The image renders at different pixel sizes on different screens. Percentages ensure overlays stay aligned regardless of display size.

---

## Step 2 — Backend

### 2.1 Entities

**`FloorPlan.java`**
```java
@Entity
@Table(name = "floor_plan")
public class FloorPlan {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "floor_id", nullable = false)
    private Floor floor;

    @Column(name = "image_path", nullable = false)
    private String imagePath;

    @Column(name = "image_width", nullable = false)
    private int imageWidth;

    @Column(name = "image_height", nullable = false)
    private int imageHeight;

    @Column(name = "uploaded_at")
    private LocalDateTime uploadedAt;

    // getters + setters
}
```

**`UnitOverlay.java`**
```java
@Entity
@Table(name = "unit_overlay")
public class UnitOverlay {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "unit_id", nullable = false)
    private Unit unit;

    // All values are percentage of image dimensions (0.000 – 100.000)
    @Column(name = "x_pct", nullable = false) private BigDecimal xPct;
    @Column(name = "y_pct", nullable = false) private BigDecimal yPct;
    @Column(name = "w_pct", nullable = false) private BigDecimal wPct;
    @Column(name = "h_pct", nullable = false) private BigDecimal hPct;

    // getters + setters
}
```

---

### 2.2 Repositories

**`FloorPlanRepository.java`**
```java
public interface FloorPlanRepository extends JpaRepository<FloorPlan, Long> {
    Optional<FloorPlan> findByFloorId(Long floorId);
}
```

**`UnitOverlayRepository.java`**
```java
public interface UnitOverlayRepository extends JpaRepository<UnitOverlay, Long> {
    Optional<UnitOverlay> findByUnitId(Long unitId);

    // Fetch all overlays for a floor in one query — avoids N+1
    @Query("SELECT uo FROM UnitOverlay uo WHERE uo.unit.floor.id = :floorId")
    List<UnitOverlay> findAllByFloorId(@Param("floorId") Long floorId);
}
```

---

### 2.3 DTOs

**`FloorMapResponse.java`** — single response object; one API call gives the frontend everything it needs
```java
public record FloorMapResponse(
    Long floorId,
    String floorLabel,
    String imageUrl,          // public URL used directly in <img src>
    List<UnitOverlayDTO> units
) {}

public record UnitOverlayDTO(
    Long unitId,
    String unitNumber,
    int bedrooms,
    BigDecimal sizeM2,
    BigDecimal monthlyRent,
    String status,            // "AVAILABLE" | "OCCUPIED"
    BigDecimal xPct,
    BigDecimal yPct,
    BigDecimal wPct,
    BigDecimal hPct
) {}
```

---

### 2.4 Services

**`FloorPlanStorageService.java`** — isolated file I/O; swap to S3 later without touching business logic
```java
@Service
public class FloorPlanStorageService {

    private final Path baseDir;

    public FloorPlanStorageService(@Value("${app.storage.base-dir}") String baseDir) {
        this.baseDir = Paths.get(baseDir);
    }

    public String store(MultipartFile file, Long floorId) throws IOException {
        String filename = "floor_" + floorId + "_" + System.currentTimeMillis()
                          + getExtension(file.getOriginalFilename());
        Path target = baseDir.resolve(filename);
        Files.createDirectories(baseDir);
        Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
        return filename;
    }

    public void delete(String filename) throws IOException {
        Files.deleteIfExists(baseDir.resolve(filename));
    }

    private String getExtension(String filename) {
        if (filename == null || !filename.contains(".")) return ".jpg";
        return filename.substring(filename.lastIndexOf('.'));
    }
}
```

**`FloorMapService.java`** — all business logic in one focused service
```java
@Service
@Transactional
public class FloorMapService {

    private final FloorRepository floorRepository;
    private final FloorPlanRepository floorPlanRepository;
    private final UnitRepository unitRepository;
    private final UnitOverlayRepository overlayRepository;
    private final FloorPlanStorageService storageService;

    @Value("${app.storage.public-url-prefix}")
    private String publicUrlPrefix;

    // ── Public ───────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public FloorMapResponse getFloorMap(Long floorId) {
        Floor floor = floorRepository.findById(floorId)
            .orElseThrow(() -> new EntityNotFoundException("Floor not found: " + floorId));

        FloorPlan plan = floorPlanRepository.findByFloorId(floorId)
            .orElseThrow(() -> new EntityNotFoundException("No floor plan for floor: " + floorId));

        List<UnitOverlayDTO> units = overlayRepository.findAllByFloorId(floorId)
            .stream().map(o -> new UnitOverlayDTO(
                o.getUnit().getId(),
                o.getUnit().getUnitNumber(),
                o.getUnit().getBedrooms(),
                o.getUnit().getSizeM2(),
                o.getUnit().getMonthlyRent(),
                o.getUnit().getStatus().name(),
                o.getXPct(), o.getYPct(), o.getWPct(), o.getHPct()
            )).toList();

        return new FloorMapResponse(floorId, floor.getLabel(),
                                    publicUrlPrefix + plan.getImagePath(), units);
    }

    // ── Admin ────────────────────────────────────────────────────

    public void uploadFloorPlan(Long floorId, MultipartFile file,
                                int imageWidth, int imageHeight) throws IOException {
        Floor floor = floorRepository.findById(floorId)
            .orElseThrow(() -> new EntityNotFoundException("Floor not found: " + floorId));

        floorPlanRepository.findByFloorId(floorId).ifPresent(old -> {
            try { storageService.delete(old.getImagePath()); }
            catch (IOException ignored) {}
            floorPlanRepository.delete(old);
        });

        FloorPlan plan = new FloorPlan();
        plan.setFloor(floor);
        plan.setImagePath(storageService.store(file, floorId));
        plan.setImageWidth(imageWidth);
        plan.setImageHeight(imageHeight);
        plan.setUploadedAt(LocalDateTime.now());
        floorPlanRepository.save(plan);
    }

    public void saveUnitOverlay(Long unitId, BigDecimal xPct, BigDecimal yPct,
                                BigDecimal wPct, BigDecimal hPct) {
        Unit unit = unitRepository.findById(unitId)
            .orElseThrow(() -> new EntityNotFoundException("Unit not found: " + unitId));

        UnitOverlay overlay = overlayRepository.findByUnitId(unitId).orElse(new UnitOverlay());
        overlay.setUnit(unit);
        overlay.setXPct(xPct); overlay.setYPct(yPct);
        overlay.setWPct(wPct); overlay.setHPct(hPct);
        overlayRepository.save(overlay);
    }

    public void toggleUnitStatus(Long unitId, UnitStatus newStatus) {
        Unit unit = unitRepository.findById(unitId)
            .orElseThrow(() -> new EntityNotFoundException("Unit not found: " + unitId));
        unit.setStatus(newStatus);
        unitRepository.save(unit);
    }
}
```

---

### 2.5 Controllers

**`FloorMapController.java`** — public
```java
@RestController
@RequestMapping("/api/floors")
public class FloorMapController {

    private final FloorMapService floorMapService;

    @GetMapping("/{floorId}/map")
    public ResponseEntity<FloorMapResponse> getFloorMap(@PathVariable Long floorId) {
        return ResponseEntity.ok(floorMapService.getFloorMap(floorId));
    }
}
```

**`AdminFloorMapController.java`** — admin-only
```java
@RestController
@RequestMapping("/api/admin/floors")
@PreAuthorize("hasRole('ADMIN')")
public class AdminFloorMapController {

    private final FloorMapService floorMapService;

    /** Multipart form: file (image), imageWidth (int), imageHeight (int) */
    @PostMapping("/{floorId}/plan")
    public ResponseEntity<Void> uploadFloorPlan(
            @PathVariable Long floorId,
            @RequestParam("file") MultipartFile file,
            @RequestParam int imageWidth,
            @RequestParam int imageHeight) throws IOException {
        floorMapService.uploadFloorPlan(floorId, file, imageWidth, imageHeight);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/units/{unitId}/overlay")
    public ResponseEntity<Void> saveOverlay(
            @PathVariable Long unitId,
            @RequestBody OverlayRequest req) {
        floorMapService.saveUnitOverlay(unitId, req.xPct(), req.yPct(), req.wPct(), req.hPct());
        return ResponseEntity.ok().build();
    }

    @PatchMapping("/units/{unitId}/status")
    public ResponseEntity<Void> toggleStatus(
            @PathVariable Long unitId,
            @RequestBody StatusRequest req) {
        floorMapService.toggleUnitStatus(unitId, req.status());
        return ResponseEntity.ok().build();
    }

    public record OverlayRequest(BigDecimal xPct, BigDecimal yPct,
                                 BigDecimal wPct, BigDecimal hPct) {}
    public record StatusRequest(UnitStatus status) {}
}
```

**`application.yml`**
```yaml
app:
  storage:
    base-dir: ./uploads/floor-plans
    public-url-prefix: http://localhost:8080/images/

spring:
  web:
    resources:
      static-locations: file:./uploads/   # serves uploaded files under /images/**
```

---

## Step 3 — Frontend

### 3.1 API Layer

**`floorMapApi.ts`**
```ts
import axios from 'axios';

const api = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL });

export interface UnitOverlayDTO {
  unitId: number;
  unitNumber: string;
  bedrooms: number;
  sizeM2: number;
  monthlyRent: number;
  status: 'AVAILABLE' | 'OCCUPIED';
  xPct: number; yPct: number;
  wPct: number; hPct: number;
}

export interface FloorMapResponse {
  floorId: number;
  floorLabel: string;
  imageUrl: string;
  units: UnitOverlayDTO[];
}

export const getFloorMap = (floorId: number) =>
  api.get<FloorMapResponse>(`/api/floors/${floorId}/map`).then(r => r.data);

export const uploadFloorPlan = (floorId: number, formData: FormData) =>
  api.post(`/api/admin/floors/${floorId}/plan`, formData);

export const saveUnitOverlay = (
  unitId: number,
  overlay: { xPct: number; yPct: number; wPct: number; hPct: number }
) => api.put(`/api/admin/floors/units/${unitId}/overlay`, overlay);

export const toggleUnitStatus = (unitId: number, status: 'AVAILABLE' | 'OCCUPIED') =>
  api.patch(`/api/admin/floors/units/${unitId}/status`, { status });
```

---

### 3.2 Custom Hook

**`useFloorMap.ts`**
```ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getFloorMap, toggleUnitStatus, saveUnitOverlay } from '../api/floorMapApi';

export function useFloorMap(floorId: number) {
  return useQuery({
    queryKey: ['floor-map', floorId],
    queryFn: () => getFloorMap(floorId),
    staleTime: 60_000,
  });
}

export function useToggleUnitStatus(floorId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ unitId, status }: { unitId: number; status: 'AVAILABLE' | 'OCCUPIED' }) =>
      toggleUnitStatus(unitId, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['floor-map', floorId] }),
  });
}

export function useSaveOverlay(floorId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: { unitId: number; xPct: number; yPct: number; wPct: number; hPct: number }) =>
      saveUnitOverlay(p.unitId, p),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['floor-map', floorId] }),
  });
}
```

---

### 3.3 Unit Overlay Component

**`UnitOverlay.tsx`** — single clickable/darkened div positioned over the image
```tsx
import React from 'react';
import { UnitOverlayDTO } from '../../api/floorMapApi';

interface Props {
  unit: UnitOverlayDTO;
  isSelected: boolean;
  onSelect: (unit: UnitOverlayDTO) => void;
}

const STATUS_STYLES: Record<string, string> = {
  AVAILABLE: 'bg-green-400 bg-opacity-40 hover:bg-opacity-60 cursor-pointer border-2 border-green-500',
  OCCUPIED:  'bg-gray-900 bg-opacity-70 cursor-not-allowed border border-gray-700',
  SELECTED:  'bg-blue-500 bg-opacity-60 cursor-pointer border-2 border-blue-400',
};

export const UnitOverlay: React.FC<Props> = React.memo(({ unit, isSelected, onSelect }) => {
  const stateKey = unit.status === 'OCCUPIED' ? 'OCCUPIED' : isSelected ? 'SELECTED' : 'AVAILABLE';

  return (
    <div
      style={{
        position: 'absolute',
        left: `${unit.xPct}%`, top:    `${unit.yPct}%`,
        width: `${unit.wPct}%`, height: `${unit.hPct}%`,
      }}
      className={`rounded transition-all duration-150 ${STATUS_STYLES[stateKey]}`}
      role={unit.status === 'AVAILABLE' ? 'button' : undefined}
      aria-label={`Unit ${unit.unitNumber}, ${unit.bedrooms} bed, ${unit.status.toLowerCase()}`}
      aria-disabled={unit.status === 'OCCUPIED'}
      onClick={() => unit.status === 'AVAILABLE' && onSelect(unit)}
    >
      {unit.status !== 'OCCUPIED' && (
        <span className="absolute inset-0 flex items-center justify-center
                         text-xs font-semibold text-white drop-shadow">
          {unit.unitNumber}
        </span>
      )}
    </div>
  );
});
```

---

### 3.4 Floor Map Component

**`FloorMap.tsx`** — image + all overlays composed together
```tsx
import React, { useState } from 'react';
import { UnitOverlayDTO } from '../../api/floorMapApi';
import { UnitOverlay } from './UnitOverlay';
import { UnitInfoPanel } from './UnitInfoPanel';

interface Props { imageUrl: string; units: UnitOverlayDTO[]; }

export const FloorMap: React.FC<Props> = ({ imageUrl, units }) => {
  const [selected, setSelected] = useState<UnitOverlayDTO | null>(null);

  const handleSelect = (unit: UnitOverlayDTO) =>
    setSelected(prev => prev?.unitId === unit.unitId ? null : unit);

  return (
    <div className="flex flex-col gap-4">

      {/* Legend */}
      <div className="flex gap-4 text-sm text-gray-600">
        <span className="flex items-center gap-1.5">
          <span className="w-4 h-4 rounded bg-green-400 inline-block"/> Available
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-4 h-4 rounded bg-gray-800 inline-block"/> Occupied
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-4 h-4 rounded bg-blue-500 inline-block"/> Selected
        </span>
      </div>

      {/* Image + Overlays — position:relative is the coordinate anchor */}
      <div className="relative inline-block w-full max-w-4xl">
        <img
          src={imageUrl}
          alt="Floor plan"
          className="w-full h-auto block select-none"
          draggable={false}
        />
        {units.map(unit => (
          <UnitOverlay
            key={unit.unitId}
            unit={unit}
            isSelected={selected?.unitId === unit.unitId}
            onSelect={handleSelect}
          />
        ))}
      </div>

      {selected && (
        <UnitInfoPanel
          unit={selected}
          onClose={() => setSelected(null)}
          onEnquire={() => { /* navigate to enquiry with selected.unitId */ }}
        />
      )}
    </div>
  );
};
```

---

### 3.5 Unit Info Panel

**`UnitInfoPanel.tsx`**
```tsx
import React from 'react';
import { UnitOverlayDTO } from '../../api/floorMapApi';

interface Props {
  unit: UnitOverlayDTO;
  onClose: () => void;
  onEnquire: () => void;
}

export const UnitInfoPanel: React.FC<Props> = ({ unit, onClose, onEnquire }) => (
  <div className="fixed bottom-0 left-0 right-0 bg-white shadow-xl rounded-t-2xl p-6 z-50
                  md:static md:rounded-xl md:border md:border-gray-200">
    <div className="flex justify-between items-start mb-4">
      <h3 className="text-lg font-bold">Unit {unit.unitNumber}</h3>
      <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
    </div>
    <div className="grid grid-cols-2 gap-3 text-sm mb-5">
      <div><p className="text-gray-500">Bedrooms</p><p className="font-semibold">{unit.bedrooms}</p></div>
      <div><p className="text-gray-500">Size</p><p className="font-semibold">{unit.sizeM2} m²</p></div>
      <div><p className="text-gray-500">Monthly Rent</p>
           <p className="font-semibold">TZS {unit.monthlyRent.toLocaleString()}</p></div>
      <div><p className="text-gray-500">Status</p>
           <p className="font-semibold text-green-600">{unit.status}</p></div>
    </div>
    <button
      onClick={onEnquire}
      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition"
    >
      Enquire About This Unit
    </button>
  </div>
);
```

---

### 3.6 Floor Map Page

**`FloorMapPage.tsx`**
```tsx
import React from 'react';
import { useParams } from 'react-router-dom';
import { useFloorMap } from '../hooks/useFloorMap';
import { FloorMap } from '../components/map/FloorMap';

export const FloorMapPage: React.FC = () => {
  const { floorId } = useParams<{ floorId: string }>();
  const { data, isLoading, isError } = useFloorMap(Number(floorId));

  if (isLoading) return <p className="p-8 text-center text-gray-500">Loading floor plan...</p>;
  if (isError || !data) return <p className="p-8 text-center text-red-500">Floor plan unavailable.</p>;

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">{data.floorLabel}</h2>
      <FloorMap imageUrl={data.imageUrl} units={data.units} />
    </div>
  );
};
```

---

### 3.7 Admin — Overlay Editor

**`OverlayEditor.tsx`** — admin draws bounding boxes on the image to define unit positions; no library needed
```tsx
import React, { useRef, useState } from 'react';
import { useSaveOverlay } from '../../hooks/useFloorMap';

interface Props { floorId: number; imageUrl: string; unitId: number; }
interface DragState { startX: number; startY: number; }
interface Box { xPct: number; yPct: number; wPct: number; hPct: number; }

const toPct = (px: number, dimension: number): number =>
  parseFloat(((px / dimension) * 100).toFixed(3));

export const OverlayEditor: React.FC<Props> = ({ floorId, imageUrl, unitId }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<DragState | null>(null);
  const [box, setBox] = useState<Box | null>(null);
  const saveOverlay = useSaveOverlay(floorId);

  const getRelativePos = (e: React.MouseEvent) => {
    const rect = containerRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top,
             w: rect.width, h: rect.height };
  };

  const onMouseDown = (e: React.MouseEvent) => {
    const { x, y } = getRelativePos(e);
    setDrag({ startX: x, startY: y });
    setBox(null);
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!drag) return;
    const { x, y, w, h } = getRelativePos(e);
    setBox({
      xPct: toPct(Math.min(drag.startX, x), w),
      yPct: toPct(Math.min(drag.startY, y), h),
      wPct: toPct(Math.abs(x - drag.startX), w),
      hPct: toPct(Math.abs(y - drag.startY), h),
    });
  };

  const onMouseUp = () => {
    setDrag(null);
    if (box) saveOverlay.mutate({ unitId, ...box });
  };

  return (
    <div
      ref={containerRef}
      className="relative inline-block w-full max-w-4xl cursor-crosshair select-none"
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
    >
      <img src={imageUrl} alt="Floor plan" className="w-full h-auto block" draggable={false} />
      {box && (
        <div
          className="absolute border-2 border-blue-500 bg-blue-300 bg-opacity-30 pointer-events-none"
          style={{ left: `${box.xPct}%`, top: `${box.yPct}%`,
                   width: `${box.wPct}%`, height: `${box.hPct}%` }}
        />
      )}
      {saveOverlay.isPending && (
        <p className="mt-2 text-sm text-blue-600">Saving overlay...</p>
      )}
    </div>
  );
};
```

---

## API Summary

| Method | Endpoint | Access | Purpose |
|--------|----------|--------|---------|
| `GET` | `/api/floors/{floorId}/map` | Public | Image URL + all unit overlays for a floor |
| `POST` | `/api/admin/floors/{floorId}/plan` | Admin | Upload floor plan image |
| `PUT` | `/api/admin/floors/units/{unitId}/overlay` | Admin | Save/update unit overlay coordinates |
| `PATCH` | `/api/admin/floors/units/{unitId}/status` | Admin | Toggle unit AVAILABLE / OCCUPIED |

---

## Data Flow

```
Admin uploads image
  → POST /api/admin/floors/{id}/plan
  → FloorPlanStorageService saves file to disk
  → floor_plan row inserted (image_path, width, height)

Admin draws a box over each apartment on OverlayEditor
  → PUT /api/admin/floors/units/{id}/overlay
  → unit_overlay row inserted/updated (x_pct, y_pct, w_pct, h_pct)

Tenant opens floor map
  → GET /api/floors/{id}/map
  → FloorMapService joins floor_plan + unit_overlay + unit
  → Returns FloorMapResponse { imageUrl, units[] }
  → FloorMap.tsx renders <img> with position:relative container
  → Each UnitOverlay div: position:absolute, coords from % values
  → OCCUPIED units → dark overlay, pointer-events none
  → AVAILABLE units → clickable → UnitInfoPanel → Enquire button
```

---

## Key Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Overlay positioning | CSS `%` + `position:absolute` | Responsive without JS resize listeners |
| No SVG / Canvas | Plain HTML `<div>` overlays | Zero dependencies; fully accessible; trivial to style |
| Single API call per floor | `FloorMapResponse` bundles image + units | Avoids waterfall requests on page load |
| Image serving | Spring Boot static resource mapping | No extra infra; swappable to S3 by changing `FloorPlanStorageService` only |
| Drag-to-draw editor | Raw mouse events on `<div>` container | No library needed; percentage math is straightforward |
| `React.memo` on `UnitOverlay` | Prevents re-renders of unaffected units | Matters when a floor has many units |

---

*End of Implementation Plan — Visual Property Map v2.0*
