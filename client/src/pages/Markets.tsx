/**
 * Markets Page - Cryptocurrency Markets with Investment Tracking
 * Focused on cryptocurrencies with conversion, scenario calculators, and portfolio tracking
 */

import { useState, useEffect, useRef } from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import { TrendingUp, TrendingDown, ArrowRightLeft, Target, ChevronDown, Plus, Trash2, Wallet, X } from 'lucide-react';
import { trpc } from '../lib/trpc';

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
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-[#0A0A0A] border border-[rgba(255,255,255,0.06)] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#C4FF3D]/40 flex items-center justify-between hover:border-[rgba(255,255,255,0.1)] transition-colors"
      >
        <span className="truncate">{selectedOption?.label || placeholder}</span>
        <ChevronDown className={`w-4 h-4 flex-shrink-0 ml-2 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div 
          className="absolute z-50 w-full mt-2 bg-[#0A0A0A] border border-[rgba(255,255,255,0.1)] rounded-lg shadow-xl overflow-hidden"
          style={{ maxHeight }}
        >
          <div className="overflow-y-auto" style={{ maxHeight }}>
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-4 py-2.5 hover:bg-[#1A1A1A] transition-colors ${
                  option.value === value ? 'bg-[#1A1A1A] text-[#C4FF3D]' : 'text-white'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Markets() {
  const [cryptos, setCryptos] = useState<Crypto[]>([]);
  const [exchangeRates, setExchangeRates] = useState<ExchangeRates>({});
  const [loading, setLoading] = useState(true);
  const [selectedCrypto, setSelectedCrypto] = useState<string | null>(null);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);

  // Currency Converter State
  const [converterAmount, setConverterAmount] = useState<string>('1');
  const [converterCurrency, setConverterCurrency] = useState<string>('COP');

  // Scenario Calculator State
  const [scenarioData, setScenarioData] = useState({
    crypto: 'bitcoin',
    buyPrice: '',
    quantity: '',
    targetPrice: '',
  });

  // Purchase Form State
  const [purchaseForm, setPurchaseForm] = useState({
    crypto: 'bitcoin',
    quantity: '',
    buyPrice: '',
    currency: 'USD',
  });

  // tRPC queries and mutations
  const utils = trpc.useContext();
  const { data: projectSummary, refetch: refetchSummary } = trpc.crypto.getProjectSummary.useQuery(
    {
      symbol: selectedCrypto || 'BTC',
      currentPrice: cryptos.find(c => c.symbol.toUpperCase() === selectedCrypto)?.current_price || 0,
    },
    {
      enabled: !!selectedCrypto && cryptos.length > 0,
    }
  );

  const { data: projectData, refetch: refetchProject } = trpc.crypto.getProject.useQuery(
    { id: projectSummary?.symbol ? 1 : 0 }, // We'll need to get the project ID properly
    { enabled: false }
  );

  const addPurchaseMutation = trpc.crypto.addPurchase.useMutation({
    onSuccess: () => {
      refetchSummary();
      setShowPurchaseModal(false);
      setPurchaseForm({ crypto: 'bitcoin', quantity: '', buyPrice: '', currency: 'USD' });
    },
  });

  const deletePurchaseMutation = trpc.crypto.deletePurchase.useMutation({
    onSuccess: () => {
      refetchSummary();
      refetchProject();
    },
  });

  // Fetch cryptocurrencies
  useEffect(() => {
    fetchCryptos();
    fetchExchangeRates();
  }, []);

  const fetchCryptos = async () => {
    try {
      const response = await fetch(
        'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=false'
      );
      const data = await response.json();
      setCryptos(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching cryptos:', error);
      setLoading(false);
    }
  };

  const fetchExchangeRates = async () => {
    try {
      const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
      const data = await response.json();
      setExchangeRates(data.rates);
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
    // Validate that fields are not empty
    if (!purchaseForm.crypto || !purchaseForm.quantity || !purchaseForm.buyPrice) {
      alert('Por favor completa todos los campos');
      return;
    }
    
    const quantity = parseFloat(purchaseForm.quantity);
    const buyPrice = parseFloat(purchaseForm.buyPrice);

    // Validate that values are valid numbers and positive
    if (isNaN(quantity) || isNaN(buyPrice) || quantity <= 0 || buyPrice <= 0) {
      alert('Por favor ingresa valores válidos (números positivos)');
      return;
    }

    // Get the symbol from the selected crypto
    const selectedCryptoData = cryptos.find(c => c.id === purchaseForm.crypto);
    if (!selectedCryptoData) {
      alert('Por favor selecciona una criptomoneda válida');
      return;
    }

    addPurchaseMutation.mutate({
      symbol: selectedCryptoData.symbol.toUpperCase(),
      quantity,
      buy_price: buyPrice,
      currency: purchaseForm.currency,
    });
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
      <div className="max-w-[1440px] mx-auto p-4 md:p-6 space-y-6 overflow-x-hidden">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">Mercados</h1>
            <p className="text-sm md:text-base text-[#8B92A8] mt-1">Consulta de criptomonedas y herramientas de conversión</p>
          </div>
          <button
            onClick={() => setShowPurchaseModal(true)}
            className="flex items-center gap-2 bg-[#C4FF3D] text-black px-4 py-2 rounded-lg hover:bg-[#C4FF3D]/90 transition-colors font-medium"
          >
            <Plus className="w-4 h-4" />
            Registrar Compra
          </button>
        </div>

        {/* Desktop: Two Columns | Mobile: Stacked */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Crypto List (2/3 width on desktop) */}
          <div className="lg:col-span-2">
            <div className="bg-[#121212] border border-[rgba(255,255,255,0.06)] rounded-2xl p-4 md:p-6">
              <h2 className="text-lg md:text-xl font-bold text-white mb-4">Criptomonedas</h2>
              <p className="text-sm text-[#8B92A8] mb-4">Precios en tiempo real • Binance</p>
              
              {loading ? (
                <div className="h-96 flex items-center justify-center text-[#8B92A8]">
                  Cargando datos...
                </div>
              ) : (
                <div className="h-96 overflow-y-auto overflow-x-hidden pr-2 space-y-2">
                  {cryptos.map((crypto) => (
                    <div
                      key={crypto.id}
                      onClick={() => handleCryptoClick(crypto.symbol)}
                      className={`flex items-center justify-between p-3 md:p-4 bg-[#0A0A0A] border rounded-xl transition-colors cursor-pointer ${
                        selectedCrypto === crypto.symbol.toUpperCase()
                          ? 'border-[#C4FF3D] bg-[#C4FF3D]/5'
                          : 'border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.1)]'
                      }`}
                    >
                      <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                        <img src={crypto.image} alt={crypto.name} className="w-8 h-8 rounded-full flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-white truncate text-sm md:text-base">{crypto.name}</div>
                          <div className="text-xs md:text-sm text-[#8B92A8] uppercase">{crypto.symbol}</div>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="font-medium text-white text-sm md:text-base">
                          ${crypto.current_price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <div
                          className={`text-xs md:text-sm flex items-center gap-1 justify-end ${
                            crypto.price_change_percentage_24h >= 0 ? 'text-green-500' : 'text-red-500'
                          }`}
                        >
                          {crypto.price_change_percentage_24h >= 0 ? (
                            <TrendingUp className="w-3 h-3 md:w-4 md:h-4" />
                          ) : (
                            <TrendingDown className="w-3 h-3 md:w-4 md:h-4" />
                          )}
                          {Math.abs(crypto.price_change_percentage_24h).toFixed(2)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Calculators (1/3 width on desktop) */}
          <div className="space-y-6">
            {/* Currency Converter */}
            <div className="bg-[#121212] border border-[rgba(255,255,255,0.06)] rounded-2xl p-4 md:p-6">
              <div className="flex items-center gap-2 mb-4">
                <ArrowRightLeft className="w-5 h-5 text-[#C4FF3D]" />
                <h2 className="text-base md:text-lg font-bold text-white">Conversor de Divisas</h2>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-[#8B92A8] mb-2">Monto en USD</label>
                  <input
                    type="number"
                    value={converterAmount}
                    onChange={(e) => setConverterAmount(e.target.value)}
                    className="w-full bg-[#0A0A0A] border border-[rgba(255,255,255,0.06)] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#C4FF3D]/40"
                    placeholder="1.00"
                  />
                </div>

                <div>
                  <label className="block text-sm text-[#8B92A8] mb-2">Moneda destino</label>
                  <CustomDropdown
                    options={currencyOptions}
                    value={converterCurrency}
                    onChange={setConverterCurrency}
                    placeholder="Seleccionar moneda"
                  />
                </div>

                <div className="bg-[#0A0A0A] border border-[rgba(255,255,255,0.06)] rounded-lg p-4">
                  <div className="text-sm text-[#8B92A8] mb-1">Resultado</div>
                  <div className="text-xl md:text-2xl font-bold text-[#C4FF3D] break-words">
                    {convertedAmount()} {converterCurrency}
                  </div>
                </div>
              </div>
            </div>

            {/* Scenario Calculator */}
            <div className="bg-[#121212] border border-[rgba(255,255,255,0.06)] rounded-2xl p-4 md:p-6">
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-5 h-5 text-[#C4FF3D]" />
                <h2 className="text-base md:text-lg font-bold text-white">Calculadora de Escenarios</h2>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-[#8B92A8] mb-2">Criptomoneda</label>
                  <CustomDropdown
                    options={cryptoOptions}
                    value={scenarioData.crypto}
                    onChange={(value) => setScenarioData({ ...scenarioData, crypto: value })}
                    placeholder="Seleccionar criptomoneda"
                    maxHeight="400px"
                  />
                </div>

                <div>
                  <label className="block text-sm text-[#8B92A8] mb-2">Precio de compra (USD)</label>
                  <input
                    type="number"
                    value={scenarioData.buyPrice}
                    onChange={(e) => setScenarioData({ ...scenarioData, buyPrice: e.target.value })}
                    className="w-full bg-[#0A0A0A] border border-[rgba(255,255,255,0.06)] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#C4FF3D]/40"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm text-[#8B92A8] mb-2">Cantidad</label>
                  <input
                    type="number"
                    value={scenarioData.quantity}
                    onChange={(e) => setScenarioData({ ...scenarioData, quantity: e.target.value })}
                    className="w-full bg-[#0A0A0A] border border-[rgba(255,255,255,0.06)] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#C4FF3D]/40"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-sm text-[#8B92A8] mb-2">Precio objetivo (USD)</label>
                  <input
                    type="number"
                    value={scenarioData.targetPrice}
                    onChange={(e) => setScenarioData({ ...scenarioData, targetPrice: e.target.value })}
                    className="w-full bg-[#0A0A0A] border border-[rgba(255,255,255,0.06)] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#C4FF3D]/40"
                    placeholder="0.00"
                  />
                </div>

                <div className="bg-[#0A0A0A] border border-[rgba(255,255,255,0.06)] rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-[#8B92A8]">Inversión inicial</span>
                    <span className="text-sm font-medium text-white">${scenarioResults.initialInvestment}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-[#8B92A8]">Valor final</span>
                    <span className="text-sm font-medium text-white">${scenarioResults.finalValue}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-[#8B92A8]">Ganancia/Pérdida</span>
                    <span
                      className={`text-sm font-medium ${
                        scenarioResults.profitLossNum >= 0 ? 'text-green-500' : 'text-red-500'
                      }`}
                    >
                      ${scenarioResults.profitLoss}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-[#8B92A8]">Retorno</span>
                    <span
                      className={`text-sm font-medium ${
                        scenarioResults.returnPercentageNum >= 0 ? 'text-green-500' : 'text-red-500'
                      }`}
                    >
                      {scenarioResults.returnPercentage}%
                    </span>
                  </div>
                </div>

                <div className="text-xs text-[#8B92A8] bg-[#0A0A0A] border border-[rgba(255,255,255,0.06)] rounded-lg p-3">
                  <strong>Disclaimer:</strong> Este es un escenario hipotético. No constituye recomendación de inversión.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Investment Tracking Section */}
        {selectedCrypto && (
          <div className="bg-[#121212] border border-[rgba(255,255,255,0.06)] rounded-2xl p-4 md:p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-[#C4FF3D]" />
                <h2 className="text-lg md:text-xl font-bold text-white">
                  Seguimiento de Inversión - {selectedCrypto}
                </h2>
              </div>
              <button
                onClick={() => setShowPurchaseModal(true)}
                className="flex items-center gap-2 bg-[#C4FF3D] text-black px-4 py-2 rounded-lg hover:bg-[#C4FF3D]/90 transition-colors font-medium"
              >
                <Plus className="w-4 h-4" />
                Registrar Compra
              </button>
            </div>

            {projectSummary ? (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-[#0A0A0A] border border-[rgba(255,255,255,0.06)] rounded-lg p-4">
                  <div className="text-sm text-[#8B92A8] mb-1">Cantidad Total</div>
                  <div className="text-xl font-bold text-white">
                    {projectSummary.totalQuantity.toFixed(8)}
                  </div>
                </div>
                
                <div className="bg-[#0A0A0A] border border-[rgba(255,255,255,0.06)] rounded-lg p-4">
                  <div className="text-sm text-[#8B92A8] mb-1">Inversión Total</div>
                  <div className="text-xl font-bold text-white">
                    ${projectSummary.totalInvestment.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
                
                <div className="bg-[#0A0A0A] border border-[rgba(255,255,255,0.06)] rounded-lg p-4">
                  <div className="text-sm text-[#8B92A8] mb-1">Valor Actual</div>
                  <div className="text-xl font-bold text-white">
                    ${projectSummary.currentValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
                
                <div className="bg-[#0A0A0A] border border-[rgba(255,255,255,0.06)] rounded-lg p-4">
                  <div className="text-sm text-[#8B92A8] mb-1">Ganancia/Pérdida</div>
                  <div className={`text-xl font-bold ${projectSummary.profitLoss >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    ${projectSummary.profitLoss.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    <span className="text-sm ml-2">
                      ({projectSummary.profitLossPercentage.toFixed(2)}%)
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-[#8B92A8]">
                No tienes compras registradas para {selectedCrypto}. Haz clic en "Registrar Compra" para comenzar.
              </div>
            )}
          </div>
        )}

        {/* Purchase Modal */}
        {showPurchaseModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-[#121212] border border-[rgba(255,255,255,0.1)] rounded-2xl p-6 max-w-md w-full">
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
                  <label className="block text-sm text-[#8B92A8] mb-2">Criptomoneda</label>
                  <CustomDropdown
                    options={cryptoOptions}
                    value={purchaseForm.crypto}
                    onChange={(value) => setPurchaseForm({ ...purchaseForm, crypto: value })}
                    placeholder="Seleccionar criptomoneda"
                    maxHeight="400px"
                  />
                </div>

                <div>
                  <label className="block text-sm text-[#8B92A8] mb-2">Cantidad comprada</label>
                  <input
                    type="number"
                    value={purchaseForm.quantity}
                    onChange={(e) => setPurchaseForm({ ...purchaseForm, quantity: e.target.value })}
                    className="w-full bg-[#0A0A0A] border border-[rgba(255,255,255,0.06)] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#C4FF3D]/40"
                    placeholder="0.00000000"
                    step="0.00000001"
                  />
                </div>

                <div>
                  <label className="block text-sm text-[#8B92A8] mb-2">Precio de compra</label>
                  <input
                    type="number"
                    value={purchaseForm.buyPrice}
                    onChange={(e) => setPurchaseForm({ ...purchaseForm, buyPrice: e.target.value })}
                    className="w-full bg-[#0A0A0A] border border-[rgba(255,255,255,0.06)] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#C4FF3D]/40"
                    placeholder="0.00"
                    step="0.01"
                  />
                </div>

                <div>
                  <label className="block text-sm text-[#8B92A8] mb-2">Moneda</label>
                  <select
                    value={purchaseForm.currency}
                    onChange={(e) => setPurchaseForm({ ...purchaseForm, currency: e.target.value })}
                    className="w-full bg-[#0A0A0A] border border-[rgba(255,255,255,0.06)] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#C4FF3D]/40"
                  >
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="COP">COP</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowPurchaseModal(false)}
                    className="flex-1 bg-[#0A0A0A] border border-[rgba(255,255,255,0.06)] text-white px-4 py-2 rounded-lg hover:border-[rgba(255,255,255,0.1)] transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleAddPurchase}
                    disabled={addPurchaseMutation.isLoading}
                    className="flex-1 bg-[#C4FF3D] text-black px-4 py-2 rounded-lg hover:bg-[#C4FF3D]/90 transition-colors font-medium disabled:opacity-50"
                  >
                    {addPurchaseMutation.isLoading ? 'Guardando...' : 'Guardar'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
