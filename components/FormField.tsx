import React from "react";
import { FormControl, FormItem, FormLabel, FormMessage } from "./ui/form";

import { Input } from "./ui/input";
import { Control, Controller, FieldValue, Path } from "react-hook-form";

interface FormFieldProps<T extends FieldValue> {
  control: Control<T>;
  name: Path<T>;
  lable: string;
  placeholder?: string;
  type?: "text" | "email" | "password" | "file";
}

const FormField = ({
  control,
  name,
  lable,
  placeholder,
  type = "text",
}: FormFieldProps<T>) => (
  <Controller
    name={name}
    control={control}
    render={({ field }) => (
      <FormItem>
        <FormLabel>{lable}</FormLabel>
        <FormControl>
          <Input
            className="input"
            placeholder={placeholder}
            type={type}
            {...field}
          />
        </FormControl>
        <FormMessage />
      </FormItem>
    )}
  />
);

export default FormField;
