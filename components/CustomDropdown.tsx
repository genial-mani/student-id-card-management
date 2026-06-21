import { useState, useEffect, useRef } from "react";

export const CustomDropdown = ({ 
  value, 
  onChange, 
  options, 
  placeholder, 
  searchable = false 
}: { 
  value: string; 
  onChange: (val: string) => void; 
  options: { label: string; value: string }[]; 
  placeholder: string; 
  searchable?: boolean 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find((opt: any) => opt.value === value);
  const filteredOptions = searchable 
    ? options.filter(opt => opt.label.toLowerCase().includes(search.toLowerCase()))
    : options;

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <div
        className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm flex items-center justify-between cursor-pointer focus:ring-2 focus:ring-violet-500 transition-colors"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) setSearch("");
        }}
      >
        <span className={selectedOption ? "text-gray-900 truncate pr-2" : "text-gray-500 truncate pr-2"}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <svg className={`w-4 h-4 text-gray-500 transition-transform shrink-0 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-150 rounded-xl shadow-lg max-h-60 overflow-y-auto no-scrollbar">
          {searchable && (
            <div className="p-2 border-b border-gray-100 sticky top-0 bg-white">
              <input
                type="text"
                autoFocus
                className="w-full px-2 py-1.5 text-xs sm:text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          )}
          {filteredOptions.length > 0 ? filteredOptions.map((opt: any) => (
            <div
              key={opt.value}
              className={`px-3 py-2 text-xs sm:text-sm cursor-pointer hover:bg-violet-50 hover:text-violet-700 transition-colors ${value === opt.value ? 'bg-violet-50 text-violet-700 font-medium' : 'text-gray-700'}`}
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
            >
              {opt.label}
            </div>
          )) : (
            <div className="px-3 py-2 text-xs sm:text-sm text-gray-500 text-center">No results</div>
          )}
        </div>
      )}
    </div>
  );
};
