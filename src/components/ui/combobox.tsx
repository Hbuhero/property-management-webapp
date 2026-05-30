import { useState } from "react"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Input } from "@/components/ui/input"

interface ComboSelectProps {
  value?: string
  onChange: (value: string) => void
  options: { label: string; value: string }[]
  placeholder?: string
}

export function ComboSelect({ value, onChange, options, placeholder }: ComboSelectProps) {
  const [isCustom, setIsCustom] = useState(false)

  return (
    <>
      {isCustom ? (
        <Input
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`${placeholder ?? "value"}`}
          onBlur={() => {
            if (!value) setIsCustom(false) // fallback if input is empty
          }}
        />
      ) : (
        <Select
          value={value}
          onValueChange={(val) => {
            if (val === "__custom__") {
              setIsCustom(true)
              onChange("")
            } else {
              onChange(val)
            }
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder={placeholder ?? "Select option"} />
          </SelectTrigger>
          <SelectContent>
            {options.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
            <SelectItem value="__custom__">Other</SelectItem>
          </SelectContent>
        </Select>
      )}
    </>
  )
}
