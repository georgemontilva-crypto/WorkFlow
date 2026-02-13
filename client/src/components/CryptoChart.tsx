/**
 * CryptoChart Component - Real-time cryptocurrency price chart
 * Uses Chart.js for rendering historical price data
 */

import { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartOptions,
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface CryptoChartProps {
  cryptoId: string;
  cryptoSymbol: string;
  days?: number;
}

interface PriceData {
  prices: [number, number][];
}

export function CryptoChart({ cryptoId, cryptoSymbol, days = 7 }: CryptoChartProps) {
  const [priceData, setPriceData] = useState<PriceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPriceHistory = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(
          `https://api.coingecko.com/api/v3/coins/${cryptoId}/market_chart?vs_currency=usd&days=${days}`
        );
        
        if (!response.ok) {
          throw new Error('Error al cargar datos históricos');
        }
        
        const data = await response.json();
        setPriceData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setLoading(false);
      }
    };

    fetchPriceHistory();
  }, [cryptoId, days]);

  if (loading) {
    return (
      <div className="h-48 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#C4FF3D] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !priceData) {
    return (
      <div className="h-48 flex items-center justify-center text-[#8B92A8] text-sm">
        {error || 'No se pudieron cargar los datos'}
      </div>
    );
  }

  // Prepare chart data
  const labels = priceData.prices.map(([timestamp]) => {
    const date = new Date(timestamp);
    if (days === 1) {
      return date.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString('es', { month: 'short', day: 'numeric' });
  });

  const prices = priceData.prices.map(([, price]) => price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceChange = prices[prices.length - 1] - prices[0];
  const isPositive = priceChange >= 0;

  const chartData = {
    labels,
    datasets: [
      {
        label: cryptoSymbol.toUpperCase(),
        data: prices,
        borderColor: isPositive ? '#22c55e' : '#ef4444',
        backgroundColor: isPositive
          ? 'rgba(34, 197, 94, 0.1)'
          : 'rgba(239, 68, 68, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 4,
        pointHoverBackgroundColor: isPositive ? '#22c55e' : '#ef4444',
        pointHoverBorderColor: '#fff',
        pointHoverBorderWidth: 2,
      },
    ],
  };

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        padding: 12,
        displayColors: false,
        callbacks: {
          label: (context) => {
            return `$${context.parsed.y.toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}`;
          },
        },
      },
    },
    scales: {
      x: {
        display: true,
        grid: {
          display: false,
        },
        ticks: {
          color: '#8B92A8',
          font: {
            size: 10,
          },
          maxTicksLimit: days === 1 ? 8 : 7,
        },
      },
      y: {
        display: true,
        position: 'right',
        grid: {
          color: 'rgba(255, 255, 255, 0.04)',
          drawBorder: false,
        },
        ticks: {
          color: '#8B92A8',
          font: {
            size: 10,
          },
          callback: (value) => {
            return `$${Number(value).toLocaleString('en-US', {
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            })}`;
          },
        },
        min: minPrice * 0.995,
        max: maxPrice * 1.005,
      },
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false,
    },
  };

  return (
    <div className="h-48">
      <Line data={chartData} options={options} />
    </div>
  );
}
