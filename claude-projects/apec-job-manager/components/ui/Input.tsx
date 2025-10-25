import { InputHTMLAttributes, forwardRef } from 'react'
import clsx from 'clsx'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <div className="w-full">
        <input
          ref={ref}
          className={clsx(
            'block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-0 sm:text-sm transition-colors',
            error
              ? 'border-apec-red focus:border-apec-red focus:ring-apec-red'
              : 'border-gray-300 focus:border-apec-blue focus:ring-apec-blue',
            className
          )}
          {...props}
        />
        {error && <p className="mt-1 text-sm text-apec-red">{error}</p>}
      </div>
    )
  }
)

Input.displayName = 'Input'
