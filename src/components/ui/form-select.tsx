import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

export type FormSelectOption = {
    value: string;
    label: string;
};

type FormSelectProps = {
    value?: string;
    onValueChange: (value: string) => void;
    options: FormSelectOption[];
    placeholder?: string;
    disabled?: boolean;
    triggerClassName?: string;
    id?: string;
};

export function FormSelect({
    value,
    onValueChange,
    options,
    placeholder = 'Select option',
    disabled,
    triggerClassName,
    id,
}: FormSelectProps) {
    return (
        <Select value={value} onValueChange={onValueChange} disabled={disabled}>
            <SelectTrigger id={id} className={cn('w-full', triggerClassName)}>
                <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
                {options.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                        {option.label}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
