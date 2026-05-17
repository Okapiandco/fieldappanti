"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, Loader2, X, Check } from "lucide-react";

interface Customer {
  id: string;
  name: string;
  accountCode: string;
}

interface CustomerSearchProps {
  selectedCustomerId: string | null;
  onSelect: (customer: Customer | null) => void;
  disabled?: boolean;
}

export default function CustomerSearch({
  selectedCustomerId,
  onSelect,
  disabled = false,
}: CustomerSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch initial selected customer name if customerId is passed but object not set
  useEffect(() => {
    if (!selectedCustomerId) {
      setSelectedCustomer(null);
      setQuery("");
      return;
    }

    if (selectedCustomer && selectedCustomer.id === selectedCustomerId) {
      return;
    }

    // Since we know customer search also preloads matches, we do a quick fetch
    setLoading(true);
    fetch(`/api/customers/search?q=${selectedCustomerId}`)
      .then((res) => res.json())
      .then((data) => {
        const found = data.find((c: Customer) => c.id === selectedCustomerId);
        if (found) {
          setSelectedCustomer(found);
          setQuery(found.name);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [selectedCustomerId]);

  // Run debounced search queries
  const performSearch = (searchTerm: string) => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    if (searchTerm.trim().length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    debounceTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/customers/search?q=${encodeURIComponent(searchTerm)}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data);
        }
      } catch (err) {
        console.error("Error searching customers:", err);
      } finally {
        setLoading(false);
      }
    }, 300);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    setOpen(true);
    performSearch(val);
  };

  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setQuery(customer.name);
    onSelect(customer);
    setOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedCustomer(null);
    setQuery("");
    setResults([]);
    onSelect(null);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => setOpen(true)}
          placeholder="Search customer name or code (min. 2 chars)..."
          disabled={disabled}
          className="w-full pl-10 pr-10 py-3 tap-target rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm placeholder:text-muted-foreground disabled:opacity-50"
        />
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">
          {loading ? (
            <Loader2 className="h-4.5 w-4.5 animate-spin text-primary" />
          ) : (
            <Search className="h-4.5 w-4.5" />
          )}
        </div>
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer rounded-full p-1"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {open && (query.trim().length >= 2 || results.length > 0) && (
        <div className="absolute z-50 w-full mt-1.5 max-h-64 overflow-y-auto glass shadow-xl rounded-lg border border-border animate-in fade-in-50 slide-in-from-top-2 duration-150">
          {results.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              {loading ? "Searching 4,000 records..." : "No matching customer found"}
            </div>
          ) : (
            <ul className="py-1">
              {results.map((customer) => {
                const isSelected = selectedCustomer?.id === customer.id;
                return (
                  <li key={customer.id}>
                    <button
                      type="button"
                      onClick={() => handleSelectCustomer(customer)}
                      className={`w-full text-left px-4 py-3 text-sm flex items-center justify-between cursor-pointer hover:bg-secondary/40 transition-colors ${
                        isSelected ? "bg-primary/10 text-primary font-medium" : "text-foreground"
                      }`}
                    >
                      <div className="flex flex-col">
                        <span>{customer.name}</span>
                        <span className="text-xs text-muted-foreground mt-0.5">
                          Code: {customer.accountCode}
                        </span>
                      </div>
                      {isSelected && <Check className="h-4 w-4 text-primary" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
