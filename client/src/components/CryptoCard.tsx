import { TrendingUp, TrendingDown, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CryptoCardProps {
  symbol: string;
  name: string;
  price: number;
  change: number;
  onRemove?: () => void;
}

export default function CryptoCard({ symbol, name, price, change, onRemove }: CryptoCardProps) {
  const isPositive = change >= 0;
  
  return (
    <div className="crypto-card min-w-[280px]">
      {/* Remove button */}
      {onRemove && (
        <Button
          variant="ghost"
          size="icon"
          className="remove-btn absolute top-2 right-2 h-6 w-6"
          onClick={onRemove}
        >
          <X className="w-4 h-4" />
        </Button>
      )}
      
      {/* Symbol */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
          <span className="text-primary font-bold text-sm">{symbol.slice(0, 2)}</span>
        </div>
        <div>
          <div className="font-semibold">{symbol}</div>
          <div className="text-xs text-muted-foreground">{name}</div>
        </div>
      </div>
      
      {/* Price */}
      <div className="text-2xl font-bold mb-2">
        ${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </div>
      
      {/* Change */}
      <div className={`flex items-center gap-1 text-sm font-medium ${
        isPositive ? 'text-green-500' : 'text-red-500'
      }`}>
        {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
        <span>{isPositive ? '+' : ''}{change.toFixed(2)}%</span>
      </div>
    </div>
  );
}
