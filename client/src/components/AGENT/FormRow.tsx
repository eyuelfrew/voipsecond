import React from "react";

interface FormRowProps {
    label: string;
    tooltip?: string;
    children: React.ReactNode;
  }
  
  const FormRow: React.FC<FormRowProps> = React.memo(({ label, tooltip, children }) => (
    <div className="flex items-center border-b border-opacity-10 py-6 last:border-b-0 group hover:bg-opacity-5 transition-all duration-300" 
         style={{ borderColor: 'var(--cc-border)' }}>
      <div className="w-1/3 pr-6 text-left text-sm font-medium flex items-center justify-start" 
           style={{ color: 'var(--cc-text)' }}>
        <span className="group-hover:scale-105 transition-transform duration-300">{label}</span>
        {tooltip && (
          <span className="ml-3 opacity-60 cursor-help hover:opacity-100 transition-opacity duration-300 hover:scale-110 transform" 
                title={tooltip}
                style={{ color: 'var(--cc-accent)' }}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </span>
        )}
      </div>
      <div className="w-2/3 pl-6">
        {children}
      </div>
    </div>
  ));

  export default FormRow;