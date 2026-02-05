/**
 * Markets Page - Cryptocurrency Markets with Investment Tracking
 * Premium trading app design with professional dark mode
 */

import { useState, useEffect, useRef } from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import { TrendingUp, TrendingDown, ArrowRightLeft, Target, ChevronDown, Plus, Trash2, Wallet, X, Wallet2, Bell } from 'lucide-react';
import { trpc } from '../lib/trpc';
import { InvestmentTracker } from '../components/InvestmentTracker';
import Toast from '../components/Toast';
import { useToast } from '../hooks/useToast';
import WalletModal from '../components/WalletModal';
import PriceAlertModal from '../components/PriceAlertModal';

interface Crypto {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_percentage_24h: number;
  market_cap: number;
  total_volume: number;
  image: string;
}

interface ExchangeRates {
  [key: string]: number;
}

interface CryptoPurchase {
  id: number;
  project_id: number;
  quantity: string;
  buy_price: string;
  currency: string;
  created_at: Date;
}

// Custom Dropdown Component
function CustomDropdown({ 
  options, 
  value, 
  onChange, 
  placeholder = 'Seleccionar',
  maxHeight = '300px'
}: { 
  options: { value: string; label: string }[]; 
  value: string; 
  onChange: (value: string) => void;
  placeholder?: string;
  maxHeight?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const selectedOption = options.find(opt => opt.value === value);
  
  const filteredOptions = options.filter(option => 
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-[#0A0A0A] border border-[rgba(255,255,255,0.06)] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[rgba(255,255,255,0.1)] flex items-center justify-between hover:border-[rgba(255,255,255,0.1)] transition-all"
      >
        <span className="truncate text-sm">{selectedOption?.label || placeholder}</span>
        <ChevronDown className={`w-4 h-4 flex-shrink-0 ml-2 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div 
          className="absolute z-50 w-full mt-2 bg-[#0A0A0A] border border-[rgba(255,255,255,0.1)] rounded-xl shadow-2xl overflow-hidden"
        >
          {/* Search Bar */}
          <div className="p-3 border-b border-[rgba(255,255,255,0.06)]">
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar criptomoneda..."
              className="w-full bg-[#121212] border border-[rgba(255,255,255,0.06)] rounded-lg px-3 py-2 text-sm text-white placeholder-[#8B92A8] focus:outline-none focus:border-[rgba(255,255,255,0.1)] transition-all"
            />
          </div>
          
          {/* Options List */}
          <div className="overflow-y-auto" style={{ maxHeight }}>
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                    setSearchTerm('');
                  }}
                  className={`w-full text-left px-4 py-3 text-sm hover:bg-[rgba(255,255,255,0.05)] transition-colors ${
                    option.value === value ? 'bg-[rgba(255,255,255,0.05)] text-white' : 'text-[#8B92A8]'
                  }`}
                >
                  {option.label}
                </button>
              ))
            ) : (
              <div className="px-4 py-8 text-center text-sm text-[#8B92A8]">
                No se encontraron resultados
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Markets() {
  const [cryptos, setCryptos] = useState<Crypto[]>([]);
  const [loading, setLoading] = useState(true);
  const [converterAmount, setConverterAmount] = useState('1');
  const [converterCurrency, setConverterCurrency] = useState('COP');
  const [exchangeRates, setExchangeRates] = useState<ExchangeRates>({});
  const [scenarioData, setScenarioData] = useState({
    crypto: '',
    buyPrice: '',
    quantity: '',
    targetPrice: '',
  });
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [purchaseForm, setPurchaseForm] = useState({
    crypto: '',
    quantity: '',
    buyPrice: '',
    currency: 'USD',
  });
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showPriceAlertModal, setShowPriceAlertModal] = useState(false);
  const [selectedAlertCrypto, setSelectedAlertCrypto] = useState<Crypto | null>(null);
  const [selectedCrypto, setSelectedCrypto] = useState<string>('');
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  const utils = trpc.useUtils();
  const toast = useToast();

  // Fetch crypto purchases
  const { data: rawProjectSummaries = [] } = trpc.crypto.getProjectSummaries.useQuery();
  const [projectSummaries, setProjectSummaries] = useState<any[]>([]);

  // Mutation to add crypto purchase
  const addPurchaseMutation = trpc.crypto.addCryptoPurchase.useMutation({
    onSuccess: () => {
      toast.success('Compra registrada exitosamente');
      setShowPurchaseModal(false);
      setPurchaseForm({
        crypto: '',
        quantity: '',
        buyPrice: '',
        currency: 'USD',
      });
      utils.crypto.getProjectSummaries.invalidate();
    },
    onError: (error) => {
      console.error('Error adding purchase:', error);
      toast.error('Error al registrar la compra');
    },
  });

  // Mutation to check price alerts
  const checkAlertsMutation = trpc.priceAlerts.checkAlerts.useMutation({
    onSuccess: (data) => {
      if (data.triggered > 0) {
        console.log(`${data.triggered} alerts triggered`);
      }
    },
    onError: (error) => {
      console.error('Error checking alerts:', error);
    },
  });

  useEffect(() => {
    fetchCryptos();
    fetchExchangeRates();

    // Auto-refresh every 10 seconds
    const interval = setInterval(() => {
      refreshData();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  // Enrich project summaries with current prices
  useEffect(() => {
    if (rawProjectSummaries.length > 0 && cryptos.length > 0) {
      const enriched = rawProjectSummaries.map((project) => {
        const crypto = cryptos.find(
          (c) => c.symbol.toUpperCase() === project.symbol.toUpperCase()
        );
        
        if (!crypto) return project;
        
        const currentPrice = crypto.current_price;
        const currentValue = project.total_quantity * currentPrice;
        const profitLoss = currentValue - project.total_invested;
        const profitLossPercentage = (profitLoss / project.total_invested) * 100;
        
        return {
          ...project,
          name: crypto.name,
          image: crypto.image,
          current_price: currentPrice,
          current_value: currentValue,
          profit_loss: profitLoss,
          profit_loss_percentage: profitLossPercentage,
          price_change_24h: crypto.price_change_percentage_24h,
        };
      });
      
      setProjectSummaries(enriched);
    } else {
      setProjectSummaries([]);
    }
  }, [rawProjectSummaries, cryptos]);

  const refreshData = async () => {
    setIsRefreshing(true);
    try {
      const newCryptos = await fetchCryptos();
      await fetchExchangeRates();
      
      // Check price alerts with new prices
      if (newCryptos && newCryptos.length > 0) {
        const prices = newCryptos.map((c: Crypto) => ({
          symbol: c.symbol.toUpperCase(),
          price: c.current_price,
        }));
        
        // Check alerts in background (don't await to avoid blocking UI)
        checkAlertsMutation.mutate({ prices });
      }
      
      // Invalidate crypto queries to recalculate with new prices
      await utils.crypto.invalidate();
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const fetchCryptos = async () => {
    try {
      const data = await utils.client.markets.getCryptos.query();
      setCryptos(data);
      setLoading(false);
      return data;
    } catch (error) {
      console.error('Error fetching cryptos:', error);
      setLoading(false);
      throw error;
    }
  };

  const fetchExchangeRates = async () => {
    try {
      const rates = await utils.client.markets.getExchangeRates.query();
      setExchangeRates(rates);
    } catch (error) {
      console.error('Error fetching exchange rates:', error);
    }
  };

  // Currency Converter Logic
  const convertedAmount = () => {
    const amount = parseFloat(converterAmount) || 0;
    const rate = exchangeRates[converterCurrency] || 1;
    return (amount * rate).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Scenario Calculator Logic
  const calculateScenario = () => {
    const buyPrice = parseFloat(scenarioData.buyPrice) || 0;
    const quantity = parseFloat(scenarioData.quantity) || 0;
    const targetPrice = parseFloat(scenarioData.targetPrice) || 0;

    const initialInvestment = buyPrice * quantity;
    const finalValue = targetPrice * quantity;
    const profitLoss = finalValue - initialInvestment;
    const returnPercentage = initialInvestment > 0 ? ((profitLoss / initialInvestment) * 100).toFixed(2) : '0';

    return {
      initialInvestment: initialInvestment.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      finalValue: finalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      profitLoss: profitLoss.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      profitLossNum: profitLoss,
      returnPercentage,
      returnPercentageNum: parseFloat(returnPercentage),
    };
  };

  const scenarioResults = calculateScenario();

  const handleAddPurchase = () => {
    console.log('handleAddPurchase called', purchaseForm);
    
    // Validate that fields are not empty
    if (!purchaseForm.crypto || !purchaseForm.quantity || !purchaseForm.buyPrice) {
      console.log('Validation failed: empty fields');
      toast.warning('Por favor completa todos los campos');
      return;
    }
    
    const quantity = parseFloat(purchaseForm.quantity);
    const buyPrice = parseFloat(purchaseForm.buyPrice);

    console.log('Parsed values:', { quantity, buyPrice });

    // Validate that values are valid numbers and positive
    if (isNaN(quantity) || isNaN(buyPrice) || quantity <= 0 || buyPrice <= 0) {
      console.log('Validation failed: invalid numbers');
      toast.warning('Por favor ingresa valores válidos (números positivos)');
      return;
    }

    // Get the symbol from the selected crypto
    const selectedCryptoData = cryptos.find(c => c.id === purchaseForm.crypto);
    console.log('Selected crypto data:', selectedCryptoData);
    
    if (!selectedCryptoData) {
      console.log('Validation failed: invalid crypto');
      toast.warning('Por favor selecciona una criptomoneda válida');
      return;
    }

    const mutationData = {
      symbol: selectedCryptoData.symbol.toUpperCase(),
      quantity,
      buy_price: buyPrice,
      currency: purchaseForm.currency,
    };
    
    console.log('Calling mutation with:', mutationData);
    addPurchaseMutation.mutate(mutationData);
  };

  const handleCryptoClick = (symbol: string) => {
    setSelectedCrypto(symbol.toUpperCase());
  };

  const currencies = [
    { code: 'COP', name: 'Peso Colombiano' },
    { code: 'MXN', name: 'Peso Mexicano' },
    { code: 'ARS', name: 'Peso Argentino' },
    { code: 'VES', name: 'Bolívar Venezolano' },
    { code: 'EUR', name: 'Euro' },
    { code: 'GBP', name: 'Libra Esterlina' },
    { code: 'JPY', name: 'Yen Japonés' },
    { code: 'CAD', name: 'Dólar Canadiense' },
    { code: 'AUD', name: 'Dólar Australiano' },
    { code: 'CHF', name: 'Franco Suizo' },
    { code: 'BRL', name: 'Real Brasileño' },
    { code: 'CNY', name: 'Yuan Chino' },
  ];

  const currencyOptions = currencies.map(c => ({
    value: c.code,
    label: `${c.code} - ${c.name}`
  }));

  const cryptoOptions = cryptos.map(c => ({
    value: c.id,
    label: `${c.name} (${c.symbol.toUpperCase()})`
  }));

  return (
    <DashboardLayout>
      <div className="max-w-[1600px] mx-auto p-4 md:p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">Mercados</h1>
            <p className="text-sm text-[#8B92A8] mt-1">Consulta de criptomonedas y herramientas de conversión</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-[#8B92A8]">
            {isRefreshing ? (
              <>
                <div className="w-2 h-2 bg-[#C4FF3D] rounded-full animate-pulse"></div>
                <span className="hidden sm:inline">Actualizando...</span>
              </>
            ) : (
              <>
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="hidden sm:inline">Actualizado {lastUpdate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
              </>
            )}
          </div>
        </div>

        {/* SECTION 1: Criptomonedas */}
        <div className="bg-[#0A0A0A] border border-[rgba(255,255,255,0.06)] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-white">Criptomonedas</h2>
              <p className="text-xs text-[#8B92A8] mt-1">Actualización automática cada 10s</p>
            </div>
          </div>
          
          {loading ? (
            <div className="h-96 flex items-center justify-center text-[#8B92A8]">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-[#C4FF3D] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p>Cargando datos...</p>
              </div>
            </div>
          ) : (
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-[rgba(255,255,255,0.1)] scrollbar-track-transparent hover:scrollbar-thumb-[rgba(255,255,255,0.2)]">
              {cryptos.map((crypto) => (
                <div
                  key={crypto.id}
                  className="flex items-center justify-between p-4 bg-[#121212] border border-[rgba(255,255,255,0.04)] rounded-xl hover:border-[rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.02)] transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <img src={crypto.image} alt={crypto.name} className="w-10 h-10 rounded-full flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-white text-base">{crypto.name}</div>
                      <div className="text-xs text-[#8B92A8] uppercase mt-0.5">{crypto.symbol}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedAlertCrypto(crypto);
                        setShowPriceAlertModal(true);
                      }}
                      className="w-9 h-9 flex items-center justify-center hover:bg-[rgba(255,255,255,0.05)] rounded-lg transition-all flex-shrink-0"
                      title="Configurar alerta de precio"
                    >
                      <Bell className="w-4 h-4 text-[#8B92A8] group-hover:text-[#C4FF3D] transition-colors" />
                    </button>
                    
                    <div className="text-right flex-shrink-0 min-w-[140px]">
                      <div className="font-semibold text-white text-base">
                        ${crypto.current_price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                      <div
                        className={`text-sm flex items-center gap-1.5 justify-end mt-0.5 ${
                          crypto.price_change_percentage_24h >= 0 ? 'text-green-500' : 'text-red-500'
                        }`}
                      >
                        {crypto.price_change_percentage_24h >= 0 ? (
                          <TrendingUp className="w-4 h-4" />
                        ) : (
                          <TrendingDown className="w-4 h-4" />
                        )}
                        {Math.abs(crypto.price_change_percentage_24h).toFixed(2)}%
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SECTION 2: Mis Activos */}
        <div className="bg-[#0A0A0A] border border-[rgba(255,255,255,0.06)] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Wallet className="w-6 h-6 text-[#C4FF3D]" />
              <h2 className="text-xl font-bold text-white">Mis activos</h2>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowWalletModal(true)}
                className="flex items-center gap-2 border border-[#C4FF3D] text-[#C4FF3D] px-4 py-2.5 rounded-xl hover:bg-[#C4FF3D]/10 transition-all font-medium text-sm"
              >
                <Wallet2 className="w-4 h-4" />
                <span className="hidden md:inline">Wallet de direcciones</span>
              </button>
              <button
                onClick={() => setShowPurchaseModal(true)}
                className="flex items-center gap-2 border border-[#C4FF3D] text-[#C4FF3D] px-4 py-2.5 rounded-xl hover:bg-[#C4FF3D]/10 transition-all font-medium text-sm"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden md:inline">Habilitar más activos</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <InvestmentTracker projectSummaries={projectSummaries} />
          </div>
        </div>

        {/* SECTION 3: Herramientas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Conversor de Divisas */}
          <div className="bg-[#0A0A0A] border border-[rgba(255,255,255,0.06)] rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <ArrowRightLeft className="w-5 h-5 text-[#C4FF3D]" />
              <h2 className="text-lg font-bold text-white">Conversor de Divisas</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-[#8B92A8] mb-2 font-medium">Monto en USD</label>
                <input
                  type="number"
                  value={converterAmount}
                  onChange={(e) => setConverterAmount(e.target.value)}
                  className="w-full bg-[#121212] border border-[rgba(255,255,255,0.06)] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#C4FF3D]/40 transition-all text-sm"
                  placeholder="1.00"
                />
              </div>

              <div>
                <label className="block text-sm text-[#8B92A8] mb-2 font-medium">Moneda destino</label>
                <CustomDropdown
                  options={currencyOptions}
                  value={converterCurrency}
                  onChange={setConverterCurrency}
                  placeholder="Seleccionar moneda"
                />
              </div>

              <div className="pt-4 border-t border-[rgba(255,255,255,0.06)]">
                <p className="text-xs text-[#8B92A8] mb-2">Resultado</p>
                <p className="text-3xl font-bold text-[#C4FF3D]">
                  {convertedAmount()} {converterCurrency}
                </p>
              </div>
            </div>
          </div>

          {/* Calculadora de Escenarios */}
          <div className="bg-[#0A0A0A] border border-[rgba(255,255,255,0.06)] rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <Target className="w-5 h-5 text-[#C4FF3D]" />
              <h2 className="text-lg font-bold text-white">Calculadora de Escenarios</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-[#8B92A8] mb-2 font-medium">Criptomoneda</label>
                <CustomDropdown
                  options={cryptoOptions}
                  value={scenarioData.crypto}
                  onChange={(value) => setScenarioData({ ...scenarioData, crypto: value })}
                  placeholder="Seleccionar criptomoneda"
                  maxHeight="200px"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-[#8B92A8] mb-2 font-medium">Precio de compra (USD)</label>
                  <input
                    type="number"
                    value={scenarioData.buyPrice}
                    onChange={(e) => setScenarioData({ ...scenarioData, buyPrice: e.target.value })}
                    className="w-full bg-[#121212] border border-[rgba(255,255,255,0.06)] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#C4FF3D]/40 transition-all text-sm"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm text-[#8B92A8] mb-2 font-medium">Cantidad</label>
                  <input
                    type="number"
                    value={scenarioData.quantity}
                    onChange={(e) => setScenarioData({ ...scenarioData, quantity: e.target.value })}
                    className="w-full bg-[#121212] border border-[rgba(255,255,255,0.06)] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#C4FF3D]/40 transition-all text-sm"
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-[#8B92A8] mb-2 font-medium">Precio objetivo (USD)</label>
                <input
                  type="number"
                  value={scenarioData.targetPrice}
                  onChange={(e) => setScenarioData({ ...scenarioData, targetPrice: e.target.value })}
                  className="w-full bg-[#121212] border border-[rgba(255,255,255,0.06)] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#C4FF3D]/40 transition-all text-sm"
                  placeholder="0.00"
                />
              </div>

              <div className="pt-4 border-t border-[rgba(255,255,255,0.06)] space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[#8B92A8]">Inversión inicial</span>
                  <span className="text-sm font-semibold text-white">${scenarioResults.initialInvestment}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[#8B92A8]">Valor final</span>
                  <span className="text-sm font-semibold text-white">${scenarioResults.finalValue}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[#8B92A8]">Ganancia/Pérdida</span>
                  <span className={`text-sm font-semibold ${scenarioResults.profitLossNum >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    ${scenarioResults.profitLoss}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[#8B92A8]">Retorno</span>
                  <span className={`text-lg font-bold ${scenarioResults.returnPercentageNum >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {scenarioResults.returnPercentage}%
                  </span>
                </div>
              </div>

              <p className="text-xs text-[#8B92A8] pt-2 border-t border-[rgba(255,255,255,0.06)]">
                Este es un escenario hipotético. No constituye asesoramiento financiero.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <Toast />
      
      {showWalletModal && (
        <WalletModal onClose={() => setShowWalletModal(false)} />
      )}

      {showPriceAlertModal && selectedAlertCrypto && (
        <PriceAlertModal
          crypto={selectedAlertCrypto}
          onClose={() => {
            setShowPriceAlertModal(false);
            setSelectedAlertCrypto(null);
          }}
        />
      )}

      {/* Purchase Modal */}
      {showPurchaseModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0A0A0A] border border-[rgba(255,255,255,0.1)] rounded-2xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Registrar Compra</h3>
              <button
                onClick={() => setShowPurchaseModal(false)}
                className="text-[#8B92A8] hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-[#8B92A8] mb-2 font-medium">Criptomoneda</label>
                <CustomDropdown
                  options={cryptoOptions}
                  value={purchaseForm.crypto}
                  onChange={(value) => setPurchaseForm({ ...purchaseForm, crypto: value })}
                  placeholder="Seleccionar criptomoneda"
                  maxHeight="200px"
                />
              </div>

              <div>
                <label className="block text-sm text-[#8B92A8] mb-2 font-medium">Cantidad</label>
                <input
                  type="number"
                  value={purchaseForm.quantity}
                  onChange={(e) => setPurchaseForm({ ...purchaseForm, quantity: e.target.value })}
                  className="w-full bg-[#121212] border border-[rgba(255,255,255,0.06)] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#C4FF3D]/40 transition-all text-sm"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm text-[#8B92A8] mb-2 font-medium">Precio de compra (USD)</label>
                <input
                  type="number"
                  value={purchaseForm.buyPrice}
                  onChange={(e) => setPurchaseForm({ ...purchaseForm, buyPrice: e.target.value })}
                  className="w-full bg-[#121212] border border-[rgba(255,255,255,0.06)] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#C4FF3D]/40 transition-all text-sm"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm text-[#8B92A8] mb-2 font-medium">Moneda</label>
                <CustomDropdown
                  options={currencyOptions}
                  value={purchaseForm.currency}
                  onChange={(value) => setPurchaseForm({ ...purchaseForm, currency: value })}
                  placeholder="Seleccionar moneda"
                />
              </div>

              <button
                onClick={handleAddPurchase}
                disabled={addPurchaseMutation.isPending}
                className="w-full bg-[#C4FF3D] text-black font-semibold py-3 rounded-xl hover:bg-[#C4FF3D]/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {addPurchaseMutation.isPending ? 'Registrando...' : 'Registrar Compra'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
