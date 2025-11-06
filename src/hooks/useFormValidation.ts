import { useState, useCallback } from 'react';
import { z, ZodSchema } from 'zod';

interface ValidationErrors {
  [key: string]: string;
}

export function useFormValidation<T extends ZodSchema>(schema: T) {
  const [errors, setErrors] = useState<ValidationErrors>({});

  const validate = useCallback(
    (data: unknown): z.infer<T> | null => {
      try {
        const validData = schema.parse(data);
        setErrors({});
        return validData;
      } catch (error) {
        if (error instanceof z.ZodError) {
          const formattedErrors: ValidationErrors = {};
          error.errors.forEach((err) => {
            if (err.path) {
              formattedErrors[err.path.join('.')] = err.message;
            }
          });
          setErrors(formattedErrors);
        }
        return null;
      }
    },
    [schema]
  );

  const validateField = useCallback(
    (fieldName: string, value: unknown): boolean => {
      try {
        if (!('shape' in schema)) return true;
        
        const schemaObj = schema as unknown as z.ZodObject<Record<string, ZodSchema>>;
        const fieldSchema = schemaObj.shape[fieldName];
        if (!fieldSchema) return true;

        fieldSchema.parse(value);
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[fieldName];
          return newErrors;
        });
        return true;
      } catch (error) {
        if (error instanceof z.ZodError) {
          setErrors((prev) => ({
            ...prev,
            [fieldName]: error.errors[0]?.message || 'Erro de validação',
          }));
        }
        return false;
      }
    },
    [schema]
  );

  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  const clearFieldError = useCallback((fieldName: string) => {
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      return newErrors;
    });
  }, []);

  return {
    errors,
    validate,
    validateField,
    clearErrors,
    clearFieldError,
    hasErrors: Object.keys(errors).length > 0,
  };
}

