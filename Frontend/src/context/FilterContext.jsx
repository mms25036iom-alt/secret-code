import React, { createContext, useContext, useState } from 'react';

const FilterContext = createContext();

export const useFilter = () => {
  const context = useContext(FilterContext);
  if (!context) {
    throw new Error('useFilter must be used within a FilterProvider');
  }
  return context;
};

export const FilterProvider = ({ children }) => {
  const [womenOnlyFilter, setWomenOnlyFilter] = useState(false);

  const toggleWomenOnlyFilter = () => {
    setWomenOnlyFilter(prev => !prev);
  };

  return (
    <FilterContext.Provider value={{ womenOnlyFilter, setWomenOnlyFilter, toggleWomenOnlyFilter }}>
      {children}
    </FilterContext.Provider>
  );
};
