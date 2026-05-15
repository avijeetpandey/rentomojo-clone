import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { CitySelector } from '@/components/CitySelector';
import { ProductCard } from '@/components/ProductCard';
import { useToast } from '@/components/ui/toaster';
import { catalogApi, type Category, type Product } from '@/lib/catalogApi';
import { useCityStore } from '@/store/cityStore';
import { ApiError } from '@/lib/api';
import { cn } from '@/lib/utils';

export default function CatalogPage() {
  const { city } = useCityStore();
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    catalogApi
      .listCategories()
      .then(({ items }) => setCategories(items))
      .catch((err: unknown) => {
        const m = err instanceof ApiError ? err.message : 'Failed to load categories';
        toast.error('Categories unavailable', m);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    catalogApi
      .listProducts({
        city,
        category: activeCategory ?? undefined,
        search: debouncedSearch || undefined,
      })
      .then((res) => {
        if (cancelled) return;
        setProducts(res.items);
        setTotal(res.total);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const m = err instanceof ApiError ? err.message : 'Failed to load products';
        toast.error('Catalog unavailable', m);
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [city, activeCategory, debouncedSearch]);

  const headline = useMemo(
    () => `${total} item${total === 1 ? '' : 's'} available in ${city}`,
    [total, city],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Browse catalog</h1>
          <p className="text-sm text-fg-muted">{headline}</p>
        </div>
        <CitySelector />
      </div>

      <Card>
        <CardContent className="p-4 flex flex-wrap items-center gap-3">
          <Input
            placeholder="Search beds, sofas, fridges…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant={activeCategory === null ? 'default' : 'outline'}
              onClick={() => setActiveCategory(null)}
            >
              All
            </Button>
            {categories.map((c) => (
              <Button
                key={c.slug}
                size="sm"
                variant={activeCategory === c.slug ? 'default' : 'outline'}
                onClick={() => setActiveCategory(c.slug)}
              >
                {c.name}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div
        className={cn(
          'grid gap-4 transition-opacity',
          'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
          loading && 'opacity-60',
        )}
      >
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
        {!loading && products.length === 0 && (
          <div className="col-span-full text-center text-fg-muted py-12">
            No products match your filters. Try a different city or category.
          </div>
        )}
      </div>
    </div>
  );
}
