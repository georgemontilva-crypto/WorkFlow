import { useState } from 'react';
import { X, Plus, Copy, Edit2, Trash2, Check, Wallet2 } from 'lucide-react';
import { trpc } from '../lib/trpc';
import SearchableDropdown from './SearchableDropdown';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Crypto logo URLs from CoinGecko CDN
const CRYPTO_LOGOS: Record<string, string> = {
  BTC: 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png',
  ETH: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png',
  USDT: 'https://assets.coingecko.com/coins/images/325/small/Tether.png',
  BNB: 'https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png',
  XRP: 'https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png',
  ADA: 'https://assets.coingecko.com/coins/images/975/small/cardano.png',
  DOGE: 'https://assets.coingecko.com/coins/images/5/small/dogecoin.png',
  SOL: 'https://assets.coingecko.com/coins/images/4128/small/solana.png',
  DOT: 'https://assets.coingecko.com/coins/images/12171/small/polkadot.png',
  MATIC: 'https://assets.coingecko.com/coins/images/4713/small/matic-token-icon.png',
  TRX: 'https://assets.coingecko.com/coins/images/1094/small/tron-logo.png',
  USDC: 'https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png',
  LTC: 'https://assets.coingecko.com/coins/images/2/small/litecoin.png',
  LINK: 'https://assets.coingecko.com/coins/images/877/small/chainlink-new-logo.png',
  AVAX: 'https://assets.coingecko.com/coins/images/12559/small/Avalanche_Circle_RedWhite_Trans.png',
  ATOM: 'https://assets.coingecko.com/coins/images/1481/small/cosmos_hub.png',
  UNI: 'https://assets.coingecko.com/coins/images/12504/small/uni.jpg',
  XLM: 'https://assets.coingecko.com/coins/images/100/small/Stellar_symbol_black_RGB.png',
  BCH: 'https://assets.coingecko.com/coins/images/780/small/bitcoin-cash-circle.png',
  ALGO: 'https://assets.coingecko.com/coins/images/4380/small/download.png',
  VET: 'https://assets.coingecko.com/coins/images/1167/small/VeChain-Logo-768x725.png',
  FIL: 'https://assets.coingecko.com/coins/images/12817/small/filecoin.png',
  ICP: 'https://assets.coingecko.com/coins/images/14495/small/Internet_Computer_logo.png',
  APT: 'https://assets.coingecko.com/coins/images/26455/small/aptos_round.png',
  NEAR: 'https://assets.coingecko.com/coins/images/10365/small/near.jpg',
  HBAR: 'https://assets.coingecko.com/coins/images/3688/small/hbar.png',
  QNT: 'https://assets.coingecko.com/coins/images/3370/small/5ZOu7brX_400x400.jpg',
  ARB: 'https://assets.coingecko.com/coins/images/16547/small/photo_2023-03-29_21.47.00.jpeg',
  OP: 'https://assets.coingecko.com/coins/images/25244/small/Optimism.png',
  IMX: 'https://assets.coingecko.com/coins/images/17233/small/immutableX-symbol-BLK-RGB.png',
  SAND: 'https://assets.coingecko.com/coins/images/12129/small/sandbox_logo.jpg',
  MANA: 'https://assets.coingecko.com/coins/images/878/small/decentraland-mana.png',
  AXS: 'https://assets.coingecko.com/coins/images/13029/small/axie_infinity_logo.png',
  THETA: 'https://assets.coingecko.com/coins/images/2538/small/theta-token-logo.png',
  FTM: 'https://assets.coingecko.com/coins/images/4001/small/Fantom_round.png',
  EOS: 'https://assets.coingecko.com/coins/images/738/small/eos-eos-logo.png',
  AAVE: 'https://assets.coingecko.com/coins/images/12645/small/AAVE.png',
  GRT: 'https://assets.coingecko.com/coins/images/13397/small/Graph_Token.png',
  XTZ: 'https://assets.coingecko.com/coins/images/976/small/Tezos-logo.png',
  FLOW: 'https://assets.coingecko.com/coins/images/13446/small/5f6294c0c7a8cda55cb1c936_Flow_Wordmark.png',
  CHZ: 'https://assets.coingecko.com/coins/images/8834/small/Chiliz.png',
  EGLD: 'https://assets.coingecko.com/coins/images/12335/small/egld-token-logo.png',
  KLAY: 'https://assets.coingecko.com/coins/images/9672/small/klaytn.png',
  RUNE: 'https://assets.coingecko.com/coins/images/6595/small/thorchain.png',
  ZEC: 'https://assets.coingecko.com/coins/images/486/small/circle-zcash-color.png',
  DASH: 'https://assets.coingecko.com/coins/images/19/small/dash-logo.png',
  XMR: 'https://assets.coingecko.com/coins/images/69/small/monero_logo.png',
  CAKE: 'https://assets.coingecko.com/coins/images/12632/small/pancakeswap-cake-logo.png',
  CRV: 'https://assets.coingecko.com/coins/images/12124/small/Curve.png',
  SUSHI: 'https://assets.coingecko.com/coins/images/12271/small/512x512_Logo_no_chop.png',
};

const NETWORKS = [
  { value: 'Bitcoin', label: 'Bitcoin (BTC)' },
  { value: 'ERC20', label: 'ERC20 (Ethereum)' },
  { value: 'TRC20', label: 'TRC20 (Tron)' },
  { value: 'BEP20', label: 'BEP20 (Binance Smart Chain)' },
  { value: 'Polygon', label: 'Polygon (MATIC)' },
  { value: 'Solana', label: 'Solana (SOL)' },
  { value: 'Cardano', label: 'Cardano (ADA)' },
  { value: 'Ripple', label: 'Ripple (XRP)' },
  { value: 'Avalanche', label: 'Avalanche C-Chain' },
  { value: 'Arbitrum', label: 'Arbitrum One' },
  { value: 'Optimism', label: 'Optimism' },
  { value: 'Polkadot', label: 'Polkadot (DOT)' },
  { value: 'Cosmos', label: 'Cosmos (ATOM)' },
  { value: 'Algorand', label: 'Algorand (ALGO)' },
  { value: 'Near', label: 'NEAR Protocol' },
  { value: 'Fantom', label: 'Fantom Opera' },
  { value: 'Hedera', label: 'Hedera (HBAR)' },
  { value: 'Stellar', label: 'Stellar (XLM)' },
  { value: 'Litecoin', label: 'Litecoin (LTC)' },
  { value: 'BitcoinCash', label: 'Bitcoin Cash (BCH)' },
  { value: 'Dogecoin', label: 'Dogecoin (DOGE)' },
  { value: 'Zcash', label: 'Zcash (ZEC)' },
  { value: 'Dash', label: 'Dash (DASH)' },
  { value: 'Monero', label: 'Monero (XMR)' },
  { value: 'EOS', label: 'EOS' },
  { value: 'Tezos', label: 'Tezos (XTZ)' },
  { value: 'Klaytn', label: 'Klaytn (KLAY)' },
  { value: 'Flow', label: 'Flow (FLOW)' },
  { value: 'Aptos', label: 'Aptos (APT)' },
  { value: 'Sui', label: 'Sui' },
];

const CRYPTOS = [
  { symbol: 'BTC', name: 'Bitcoin' },
  { symbol: 'ETH', name: 'Ethereum' },
  { symbol: 'USDT', name: 'Tether' },
  { symbol: 'BNB', name: 'Binance Coin' },
  { symbol: 'XRP', name: 'Ripple' },
  { symbol: 'ADA', name: 'Cardano' },
  { symbol: 'DOGE', name: 'Dogecoin' },
  { symbol: 'SOL', name: 'Solana' },
  { symbol: 'DOT', name: 'Polkadot' },
  { symbol: 'MATIC', name: 'Polygon' },
  { symbol: 'TRX', name: 'Tron' },
  { symbol: 'USDC', name: 'USD Coin' },
  { symbol: 'LTC', name: 'Litecoin' },
  { symbol: 'LINK', name: 'Chainlink' },
  { symbol: 'AVAX', name: 'Avalanche' },
  { symbol: 'ATOM', name: 'Cosmos' },
  { symbol: 'UNI', name: 'Uniswap' },
  { symbol: 'XLM', name: 'Stellar' },
  { symbol: 'BCH', name: 'Bitcoin Cash' },
  { symbol: 'ALGO', name: 'Algorand' },
  { symbol: 'VET', name: 'VeChain' },
  { symbol: 'FIL', name: 'Filecoin' },
  { symbol: 'ICP', name: 'Internet Computer' },
  { symbol: 'APT', name: 'Aptos' },
  { symbol: 'NEAR', name: 'NEAR Protocol' },
  { symbol: 'HBAR', name: 'Hedera' },
  { symbol: 'QNT', name: 'Quant' },
  { symbol: 'ARB', name: 'Arbitrum' },
  { symbol: 'OP', name: 'Optimism' },
  { symbol: 'IMX', name: 'Immutable X' },
  { symbol: 'SAND', name: 'The Sandbox' },
  { symbol: 'MANA', name: 'Decentraland' },
  { symbol: 'AXS', name: 'Axie Infinity' },
  { symbol: 'THETA', name: 'Theta Network' },
  { symbol: 'FTM', name: 'Fantom' },
  { symbol: 'EOS', name: 'EOS' },
  { symbol: 'AAVE', name: 'Aave' },
  { symbol: 'GRT', name: 'The Graph' },
  { symbol: 'XTZ', name: 'Tezos' },
  { symbol: 'FLOW', name: 'Flow' },
  { symbol: 'CHZ', name: 'Chiliz' },
  { symbol: 'EGLD', name: 'MultiversX' },
  { symbol: 'KLAY', name: 'Klaytn' },
  { symbol: 'RUNE', name: 'THORChain' },
  { symbol: 'ZEC', name: 'Zcash' },
  { symbol: 'DASH', name: 'Dash' },
  { symbol: 'XMR', name: 'Monero' },
  { symbol: 'CAKE', name: 'PancakeSwap' },
  { symbol: 'CRV', name: 'Curve DAO' },
  { symbol: 'SUSHI', name: 'SushiSwap' },
];

export default function WalletModal({ isOpen, onClose }: WalletModalProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    crypto_symbol: 'BTC',
    network: 'Bitcoin',
    address: '',
    alias: '',
    note: '',
  });

  const utils = trpc.useContext();
  const { data: addresses = [] } = trpc.wallet.listAddresses.useQuery();

  const addMutation = trpc.wallet.addAddress.useMutation({
    onSuccess: async () => {
      await utils.wallet.invalidate();
      setShowAddForm(false);
      resetForm();
    },
  });

  const updateMutation = trpc.wallet.updateAddress.useMutation({
    onSuccess: async () => {
      await utils.wallet.invalidate();
      setEditingId(null);
      resetForm();
    },
  });

  const deleteMutation = trpc.wallet.deleteAddress.useMutation({
    onSuccess: async () => {
      await utils.wallet.invalidate();
      setDeleteConfirmId(null);
    },
  });

  const resetForm = () => {
    setFormData({
      crypto_symbol: 'BTC',
      network: 'Bitcoin',
      address: '',
      alias: '',
      note: '',
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingId) {
      updateMutation.mutate({ id: editingId, ...formData });
    } else {
      addMutation.mutate(formData);
    }
  };

  const handleEdit = (address: any) => {
    setFormData({
      crypto_symbol: address.crypto_symbol,
      network: address.network,
      address: address.address,
      alias: address.alias || '',
      note: address.note || '',
    });
    setEditingId(address.id);
    setShowAddForm(true);
  };

  const handleCopy = (address: string, id: number) => {
    navigator.clipboard.writeText(address);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const maskAddress = (address: string) => {
    if (address.length <= 12) return address;
    return `${address.slice(0, 6)}...${address.slice(-6)}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-[#121212] border border-[rgba(255,255,255,0.1)] rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[rgba(255,255,255,0.06)]">
          <div className="flex items-center gap-3">
            <Wallet2 className="w-6 h-6 text-[#C4FF3D]" />
            <h2 className="text-2xl font-bold text-white">Wallet de Direcciones</h2>
          </div>
          <button
            onClick={onClose}
            className="text-[#8B92A8] hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Disclaimer */}
        <div className="px-6 pt-4">
          <div className="bg-[#0A0A0A] border border-[rgba(255,255,255,0.06)] rounded-xl p-4">
            <p className="text-xs text-[#8B92A8] text-center">
              <strong className="text-[#C4FF3D]">Aviso:</strong> Finwrk no custodia fondos ni llaves privadas.
              Estas direcciones son solo informativas.
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {!showAddForm && addresses.length === 0 && (
            <div className="text-center py-12">
              <Wallet2 className="w-16 h-16 text-[#8B92A8] mx-auto mb-4" />
              <p className="text-[#8B92A8] mb-6">No tienes direcciones guardadas</p>
              <button
                onClick={() => setShowAddForm(true)}
                className="inline-flex items-center gap-2 bg-transparent border-2 border-[#C4FF3D] text-[#C4FF3D] px-6 py-3 rounded-xl hover:bg-[#C4FF3D]/10 transition-colors font-medium"
              >
                <Plus className="w-5 h-5" />
                Añadir Primera Dirección
              </button>
            </div>
          )}

          {!showAddForm && addresses.length > 0 && (
            <div className="space-y-4">
              {addresses.map((addr) => (
                <div
                  key={addr.id}
                  className="bg-gradient-to-br from-[#1a1a1a] to-[#0A0A0A] border border-[rgba(255,255,255,0.1)] rounded-2xl p-6 hover:border-[#C4FF3D]/30 transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-[#C4FF3D]/10 rounded-full flex items-center justify-center p-2">
                        {CRYPTO_LOGOS[addr.crypto_symbol] ? (
                          <img
                            src={CRYPTO_LOGOS[addr.crypto_symbol]}
                            alt={addr.crypto_symbol}
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <span className="text-lg font-bold text-[#C4FF3D]">
                            {addr.crypto_symbol}
                          </span>
                        )}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white">{addr.crypto_symbol}</h3>
                        <p className="text-sm text-[#8B92A8]">{addr.network}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCopy(addr.address, addr.id)}
                        className="p-2 text-[#8B92A8] hover:text-[#C4FF3D] transition-colors"
                        title="Copiar dirección"
                      >
                        {copiedId === addr.id ? (
                          <Check className="w-4 h-4 text-green-500" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={() => handleEdit(addr)}
                        className="p-2 text-[#8B92A8] hover:text-[#C4FF3D] transition-colors"
                        title="Editar"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      {deleteConfirmId === addr.id ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => deleteMutation.mutate({ id: addr.id })}
                            className="px-3 py-1 text-xs bg-red-500 text-white rounded-lg hover:bg-red-600"
                          >
                            Confirmar
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="px-3 py-1 text-xs bg-[#8B92A8] text-white rounded-lg hover:bg-[#8B92A8]/80"
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirmId(addr.id)}
                          className="p-2 text-[#8B92A8] hover:text-red-500 transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="bg-[#0A0A0A] border border-[rgba(255,255,255,0.06)] rounded-xl p-4 mb-3">
                    <p className="text-xs text-[#8B92A8] mb-1">Dirección</p>
                    <p className="text-sm font-mono text-white break-all">{maskAddress(addr.address)}</p>
                  </div>

                  {addr.alias && (
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs text-[#8B92A8]">Alias:</span>
                      <span className="text-sm text-white font-medium">{addr.alias}</span>
                    </div>
                  )}

                  {addr.note && (
                    <p className="text-xs text-[#8B92A8] mt-2">{addr.note}</p>
                  )}
                </div>
              ))}
            </div>
          )}

          {showAddForm && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <SearchableDropdown
                label="Criptomoneda"
                options={CRYPTOS.map(crypto => ({
                  value: crypto.symbol,
                  label: `${crypto.name} (${crypto.symbol})`,
                  icon: CRYPTO_LOGOS[crypto.symbol],
                }))}
                value={formData.crypto_symbol}
                onChange={(value) => setFormData({ ...formData, crypto_symbol: value })}
                placeholder="Seleccionar criptomoneda"
              />

              <SearchableDropdown
                label="Red / Blockchain"
                options={NETWORKS}
                value={formData.network}
                onChange={(value) => setFormData({ ...formData, network: value })}
                placeholder="Seleccionar red"
              />

              <div>
                <label className="block text-sm text-[#8B92A8] mb-2">Dirección Pública</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full bg-[#0A0A0A] border border-[rgba(255,255,255,0.06)] rounded-xl px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-[#C4FF3D]/40"
                  placeholder="0x..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-[#8B92A8] mb-2">Alias (opcional)</label>
                <input
                  type="text"
                  value={formData.alias}
                  onChange={(e) => setFormData({ ...formData, alias: e.target.value })}
                  className="w-full bg-[#0A0A0A] border border-[rgba(255,255,255,0.06)] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#C4FF3D]/40"
                  placeholder="Ej: Binance, Personal, Cliente"
                />
              </div>

              <div>
                <label className="block text-sm text-[#8B92A8] mb-2">Nota (opcional)</label>
                <textarea
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  className="w-full bg-[#0A0A0A] border border-[rgba(255,255,255,0.06)] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#C4FF3D]/40 resize-none"
                  rows={3}
                  placeholder="Información adicional..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={addMutation.isPending || updateMutation.isPending}
                  className="flex-1 bg-[#C4FF3D] text-black px-6 py-3 rounded-xl hover:bg-[#C4FF3D]/90 transition-colors font-medium disabled:opacity-50"
                >
                  {editingId ? 'Actualizar' : 'Guardar'} Dirección
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingId(null);
                    resetForm();
                  }}
                  className="px-6 py-3 border-2 border-[#8B92A8] text-[#8B92A8] rounded-xl hover:bg-[#8B92A8]/10 transition-colors font-medium"
                >
                  Cancelar
                </button>
              </div>

              {(addMutation.isError || updateMutation.isError) && (
                <p className="text-red-500 text-sm text-center">
                  {addMutation.error?.message || updateMutation.error?.message}
                </p>
              )}
            </form>
          )}
        </div>

        {/* Footer with Add Button */}
        {!showAddForm && addresses.length > 0 && (
          <div className="p-6 border-t border-[rgba(255,255,255,0.06)]">
            <button
              onClick={() => setShowAddForm(true)}
              className="w-full flex items-center justify-center gap-2 bg-transparent border-2 border-[#C4FF3D] text-[#C4FF3D] px-6 py-3 rounded-xl hover:bg-[#C4FF3D]/10 transition-colors font-medium"
            >
              <Plus className="w-5 h-5" />
              Añadir Nueva Dirección
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
