import { useState, useCallback, useMemo } from "react";

export interface FormField<T = any> {
  value: T;
  error?: string;
  touched: boolean;
}

export interface FormFieldConfig<T = any> {
  initialValue: T;
  validate?: (value: T) => string | undefined;
  required?: boolean;
}

export interface UseFormOptions<T extends Record<string, any>> {
  initialValues: T;
  validationSchema?: Partial<Record<keyof T, FormFieldConfig<T[keyof T]>["validate"]>>;
  onSubmit?: (values: T) => Promise<void> | void;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
}

export interface UseFormReturn<T extends Record<string, any>> {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  isSubmitting: boolean;
  isValid: boolean;
  setValue: <K extends keyof T>(field: K, value: T[K]) => void;
  setError: <K extends keyof T>(field: K, error: string) => void;
  setTouched: <K extends keyof T>(field: K, touched: boolean) => void;
  setFieldValue: <K extends keyof T>(field: K, value: T[K]) => void;
  setFieldError: <K extends keyof T>(field: K, error: string | undefined) => void;
  setFieldTouched: <K extends keyof T>(field: K, touched?: boolean) => void;
  handleChange: <K extends keyof T>(field: K) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  handleBlur: <K extends keyof T>(field: K) => () => void;
  handleSubmit: (event: React.FormEvent) => void;
  validateField: <K extends keyof T>(field: K) => string | undefined;
  validateForm: () => boolean;
  resetForm: () => void;
  clearErrors: () => void;
}

// Common validation functions
export const validators = {
  required: (message = "This field is required") => (value: any): string | undefined => {
    if (value === null || value === undefined || value === "" || (Array.isArray(value) && value.length === 0)) {
      return message;
    }
    return undefined;
  },

  email: (message = "Please enter a valid email address") => (value: string): string | undefined => {
    if (!value) return undefined;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return message;
    }
    return undefined;
  },

  minLength: (min: number, message?: string) => (value: string): string | undefined => {
    if (!value) return undefined;
    if (value.length < min) {
      return message || `Must be at least ${min} characters long`;
    }
    return undefined;
  },

  maxLength: (max: number, message?: string) => (value: string): string | undefined => {
    if (!value) return undefined;
    if (value.length > max) {
      return message || `Must be no more than ${max} characters long`;
    }
    return undefined;
  },

  pattern: (pattern: RegExp, message: string) => (value: string): string | undefined => {
    if (!value) return undefined;
    if (!pattern.test(value)) {
      return message;
    }
    return undefined;
  },

  username: (message = "Username must be 3-20 characters long and contain only letters, numbers, underscores, and hyphens") => (value: string): string | undefined => {
    if (!value) return undefined;
    if (!/^[a-zA-Z0-9_-]{3,20}$/.test(value)) {
      return message;
    }
    return undefined;
  },

  password: (message = "Password must be at least 6 characters long") => (value: string): string | undefined => {
    if (!value) return undefined;
    if (value.length < 6) {
      return message;
    }
    return undefined;
  },

  confirmPassword: (passwordField: string, message = "Passwords do not match") => (value: string, allValues: Record<string, any>): string | undefined => {
    if (!value) return undefined;
    if (value !== allValues[passwordField]) {
      return message;
    }
    return undefined;
  },

  number: (message = "Must be a valid number") => (value: any): string | undefined => {
    if (value === null || value === undefined || value === "") return undefined;
    if (isNaN(Number(value))) {
      return message;
    }
    return undefined;
  },

  min: (min: number, message?: string) => (value: number): string | undefined => {
    if (value === null || value === undefined) return undefined;
    if (Number(value) < min) {
      return message || `Must be at least ${min}`;
    }
    return undefined;
  },

  max: (max: number, message?: string) => (value: number): string | undefined => {
    if (value === null || value === undefined) return undefined;
    if (Number(value) > max) {
      return message || `Must be no more than ${max}`;
    }
    return undefined;
  },

  compose: (...validators: Array<(value: any, allValues?: Record<string, any>) => string | undefined>) => 
    (value: any, allValues?: Record<string, any>): string | undefined => {
      for (const validator of validators) {
        const error = validator(value, allValues);
        if (error) return error;
      }
      return undefined;
    }
};

export function useForm<T extends Record<string, any>>({
  initialValues,
  validationSchema = {},
  onSubmit,
  validateOnChange = true,
  validateOnBlur = true
}: UseFormOptions<T>): UseFormReturn<T> {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouchedState] = useState<Partial<Record<keyof T, boolean>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateField = useCallback(<K extends keyof T>(field: K): string | undefined => {
    const validator = validationSchema[field];
    if (!validator) return undefined;

    return validator(values[field], values);
  }, [values, validationSchema]);

  const validateForm = useCallback((): boolean => {
    const newErrors: Partial<Record<keyof T, string>> = {};
    let hasErrors = false;

    for (const field in validationSchema) {
      const error = validateField(field);
      if (error) {
        newErrors[field] = error;
        hasErrors = true;
      }
    }

    setErrors(newErrors);
    return !hasErrors;
  }, [validateField, validationSchema]);

  const isValid = useMemo(() => {
    return Object.keys(errors).length === 0;
  }, [errors]);

  const setValue = useCallback(<K extends keyof T>(field: K, value: T[K]) => {
    setValues(prev => ({ ...prev, [field]: value }));
    
    if (validateOnChange) {
      const error = validateField(field);
      setErrors(prev => ({ ...prev, [field]: error }));
    }
  }, [validateField, validateOnChange]);

  const setError = useCallback(<K extends keyof T>(field: K, error: string) => {
    setErrors(prev => ({ ...prev, [field]: error }));
  }, []);

  const setTouched = useCallback(<K extends keyof T>(field: K, isTouched: boolean) => {
    setTouchedState(prev => ({ ...prev, [field]: isTouched }));
  }, []);

  const setFieldValue = setValue;
  const setFieldError = useCallback(<K extends keyof T>(field: K, error: string | undefined) => {
    setErrors(prev => {
      if (error) {
        return { ...prev, [field]: error };
      } else {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      }
    });
  }, []);

  const setFieldTouched = useCallback(<K extends keyof T>(field: K, isTouched: boolean = true) => {
    setTouched(field, isTouched);
  }, [setTouched]);

  const handleChange = useCallback(<K extends keyof T>(field: K) => 
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const value = event.target.type === 'checkbox' 
        ? (event.target as HTMLInputElement).checked as T[K]
        : event.target.value as T[K];
      
      setValue(field, value);
    }, [setValue]);

  const handleBlur = useCallback(<K extends keyof T>(field: K) => () => {
    setTouched(field, true);
    
    if (validateOnBlur) {
      const error = validateField(field);
      setErrors(prev => ({ ...prev, [field]: error }));
    }
  }, [validateField, validateOnBlur, setTouched]);

  const handleSubmit = useCallback((event: React.FormEvent) => {
    event.preventDefault();
    
    if (!onSubmit) return;
    
    const isFormValid = validateForm();
    
    // Mark all fields as touched
    const allTouched = Object.keys(initialValues).reduce((acc, key) => {
      acc[key as keyof T] = true;
      return acc;
    }, {} as Partial<Record<keyof T, boolean>>);
    setTouchedState(allTouched);
    
    if (isFormValid) {
      setIsSubmitting(true);
      
      Promise.resolve(onSubmit(values))
        .catch((error) => {
          console.error('Form submission error:', error);
        })
        .finally(() => {
          setIsSubmitting(false);
        });
    }
  }, [onSubmit, validateForm, values, initialValues]);

  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouchedState({});
    setIsSubmitting(false);
  }, [initialValues]);

  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  return {
    values,
    errors,
    touched,
    isSubmitting,
    isValid,
    setValue,
    setError,
    setTouched,
    setFieldValue,
    setFieldError,
    setFieldTouched,
    handleChange,
    handleBlur,
    handleSubmit,
    validateField,
    validateForm,
    resetForm,
    clearErrors
  };
}