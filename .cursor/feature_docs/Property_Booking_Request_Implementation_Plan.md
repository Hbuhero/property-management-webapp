# Property Booking Requests and Lease Contract Agreement Plan

## Summary

Tenants book available marketplace units. Owners approve or reject requests. Approved requests mark the unit as booked and prepare a lease contract. The tenant then accepts or rejects the contract, and the decision is stored directly on the `LeaseContract` record as legal evidence.

Current gaps:
- Booking/application backend does not exist.
- Lease/contract backend exists only as incomplete entities and empty controllers.
- Owner applications and tenant lease pages are placeholder UI.
- Unit-level marketplace and floor map data already exist and should be reused.

## Backend Changes

- Add unit-specific `PropertyApplication`.
  - Path: `/api/v1/applications`.
  - Fields: tenant, property, floorUnit, status, coverNote, applicantData, rejectionReason, reviewedBy, reviewedAt, timestamps.
  - Statuses: `PENDING`, `APPROVED`, `REJECTED`, `WITHDRAWN`, `CONTRACT_SENT`, `CONTRACT_ACCEPTED`, `CONTRACT_REJECTED`.
  - Enforce tenant-only create, owner/admin review, available-unit-only booking, and no duplicate active request for same tenant/unit.

- Extend unit lifecycle.
  - Add `BOOKED` to `FloorUnitStatus`.
  - Owner approval sets unit to `BOOKED`.
  - Tenant contract acceptance sets unit to `OCCUPIED`.
  - Tenant rejection releases unit to `AVAILABLE`.
  - Approval auto-rejects competing pending requests for the same unit.

- Complete lease contract model.
  - Add `LeasePreset` and `LeasePresetItem` for owner-defined reusable unit lease defaults.
  - Allow preset items to define when they start and how long they apply within the lease period.
  - Use `LeaseContract` and `LeaseContractItem` as the contract snapshot sent to a tenant.
  - Contract statuses: `DRAFT`, `SENT`, `ACCEPTED`, `REJECTED`, `TERMINATED`.

- Store tenant decision evidence on `LeaseContract`.
  - Add fields such as `tenantDecision`, `tenantDecisionAt`, `tenantRejectionReason`.
  - Add booleans: `acceptedSystemTerms`, `confirmedPropertyAuthenticity`.
  - Add `systemTermsVersion` and `systemTermsSnapshot`.
  - Do not track IP address or user agent.

- Implement contract flow.
  - `PUT /api/v1/applications/{id}/approve`: approve request and auto-create `DRAFT` contract if a unit preset exists.
  - `POST /api/v1/lease-contracts`: owner manually creates contract when no preset exists.
  - `PUT /api/v1/lease-contracts/{id}/send`: owner sends contract to tenant.
  - `PUT /api/v1/lease-contracts/{id}/tenant-accept`: tenant accepts with required confirmations.
  - `PUT /api/v1/lease-contracts/{id}/tenant-reject`: tenant rejects with reason.

- Add owner lease preset APIs.
  - `GET /api/v1/owner/properties/{propertyId}/units/{unitId}/lease-preset`
  - `PUT /api/v1/owner/properties/{propertyId}/units/{unitId}/lease-preset`
  - Include owner-defined booking requirements on the preset so marketplace booking forms can ask for required acquisition data.

## Portal Changes

- Add schemas, API modules, and React Query hooks for applications, lease contracts, and lease presets.
- Update `MapUnitStatusSchema` to include `BOOKED`.
- Add booking action from public floor map unit panel.
  - Tenant can request booking for an available unit.
  - Tenant answers owner-defined booking requirement fields before submission.
  - Anonymous user redirects to login and returns to the selected unit.
- Replace owner `ApplicationInbox.tsx` static data with real request list and approve/reject actions.
- Add owner lease preset editor per unit.
  - Owners can define multiple scheduled lease items with amount, recurrence, start offset, and duration.
  - Owners can define booking requirement questions per unit.
- Replace tenant `LeaseManagement.tsx` static data with real applications/contracts.
  - Sent contracts show terms, scheduled item timelines, totals, and required legal checkboxes.
  - Accept requires system terms + property authenticity confirmation.
  - Reject requires a reason.

## Test Plan

- Tenant submits a booking for an available unit.
- Tenant submits required owner-defined booking data, and owner can view it in the application inbox.
- Duplicate active booking for the same tenant/unit fails.
- Owner cannot review another owner's unit request.
- Approval marks the unit `BOOKED` and rejects competing pending requests.
- Approval creates a draft contract when a preset exists.
- Preset item timelines are copied into contract item start/end dates.
- Tenant acceptance stores decision fields on `LeaseContract` and marks unit `OCCUPIED`.
- Tenant rejection stores decision fields on `LeaseContract` and releases unit to `AVAILABLE`.
- Portal build passes with new schemas and hooks.

## Assumptions

- Booking is unit-specific only.
- Auto contract draft happens only when the unit has an active lease preset.
- Tenant decision evidence is stored on `LeaseContract`, not in a separate table.
- IP address and user agent are not tracked.
- Caretaker/property-manager workflow is deferred because the current backend role model does not include `CARETAKER`.
