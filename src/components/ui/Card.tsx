import { cn } from '../../utils/cn';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function Card({ children, className, style }: CardProps) {
  return (
    <div style={style} className={cn('rounded-xl border border-gray-200 bg-white shadow-sm', className)}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className }: CardProps) {
  return (
    <div className={cn('border-b border-gray-200 px-6 py-4', className)}>{children}</div>
  );
}

export function CardBody({ children, className }: CardProps) {
  return <div className={cn('px-6 py-5', className)}>{children}</div>;
}

export function CardFooter({ children, className }: CardProps) {
  return (
    <div className={cn('border-t border-gray-200 px-6 py-4', className)}>{children}</div>
  );
}
