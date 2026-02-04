import { useState, useEffect, useRef } from 'react';
import { ChevronDown, Search } from 'lucide-react';

interface Option {
  value: string;
  label: string;
  icon?: string;
}

interface SearchableDropdownProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
}

export default function SearchableDropdown({
  options,
  value,
  onChange,
  placeholder = 'Seleccionar',
  label,
}: SearchableDropdownProps) {
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
    option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    option.value.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div ref={dropdownRef} className="relative">
      {label && (
        <label className="block text-sm text-[#8B92A8] mb-2">{label}</label>
      )}
      
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-[#0A0A0A] border border-[rgba(255,255,255,0.06)] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#C4FF3D]/40 flex items-center justify-between hover:border-[rgba(255,255,255,0.1)] transition-colors"
      >
        <span className="flex items-center gap-2 truncate">
          {selectedOption?.icon && (
            <span className="text-lg">{selectedOption.icon}</span>
          )}
          <span>{selectedOption?.label || placeholder}</span>
        </span>
        <ChevronDown
          className={`w-4 h-4 flex-shrink-0 ml-2 transition-transform text-[#8B92A8] ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-[#0A0A0A] border border-[rgba(255,255,255,0.1)] rounded-xl shadow-2xl overflow-hidden">
          {/* Search Bar */}
          <div className="p-3 border-b border-[rgba(255,255,255,0.06)]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8B92A8]" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar..."
                className="w-full bg-[#121212] border border-[rgba(255,255,255,0.06)] rounded-lg pl-10 pr-4 py-2 text-white text-sm focus:outline-none focus:border-[#C4FF3D]/40 placeholder-[#8B92A8]"
              />
            </div>
          </div>

          {/* Options List with Fixed Height and Scroll */}
          <div className="overflow-y-auto max-h-[280px]">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  className={`w-full text-left px-4 py-3 hover:bg-[rgba(255,255,255,0.05)] transition-colors flex items-center gap-3 ${
                    option.value === value
                      ? 'bg-[rgba(196,255,61,0.1)] text-[#C4FF3D]'
                      : 'text-white'
                  }`}
                >
                  {option.icon && (
                    <span className="text-lg flex-shrink-0">{option.icon}</span>
                  )}
                  <span className="truncate">{option.label}</span>
                </button>
              ))
            ) : (
              <div className="px-4 py-8 text-center text-[#8B92A8] text-sm">
                No se encontraron resultados
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
