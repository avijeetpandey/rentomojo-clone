import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn, formatCurrencyINR } from '@/lib/utils';
import type { Product } from '@/lib/catalogApi';

export function ProductCard({ product, className }: { product: Product; className?: string }) {
  const m1 = product.tenureOptions.find((t) => t.tenure === 'M1')!;
  const m12 = product.tenureOptions.find((t) => t.tenure === 'M12')!;

  return (
    <Card className={cn('overflow-hidden flex flex-col', className)}>
      <div className="aspect-[4/3] bg-canvas-subtle overflow-hidden">
        <img
          src={product.imageUrl}
          alt={product.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform hover:scale-105"
        />
      </div>
      <CardContent className="p-4 flex flex-col gap-2 flex-1">
        <div className="text-xs uppercase tracking-wide text-fg-muted">{product.category.name}</div>
        <h3 className="font-semibold text-fg leading-tight line-clamp-2">{product.name}</h3>
        <p className="text-xs text-fg-muted line-clamp-2">{product.description}</p>
        <div className="mt-auto pt-2 flex items-end justify-between">
          <div>
            <div className="text-lg font-semibold">
              {formatCurrencyINR(m1.unitMonthlyRent)}
              <span className="text-xs font-normal text-fg-muted"> /mo</span>
            </div>
            <div className="text-[11px] text-fg-muted">
              from {formatCurrencyINR(m12.unitMonthlyRent)}/mo on 12-mo
            </div>
          </div>
          <Button asChild size="sm" variant="outline">
            <Link to={`/products/${product.slug}`}>View</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
