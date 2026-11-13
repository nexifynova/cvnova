'use client';

import React from 'react';

interface CVPreviewProps {
  template: string;
  formData: any;
}

export default function CVPreview({ template, formData }: CVPreviewProps) {
  return (
    <div className="bg-white h-full text-gray-800">
      
      {/* TEMPLATE 1: CLASSIC GRAY */}
      {template === 'classicgray' && (
         <div className="flex h-full">
            {/* Aapka classicgray wala code yahan aayega */}
            <div className="w-[35%] bg-[#E5E7EB] p-6">...</div>
            <div className="w-[65%] p-8">...</div>
         </div>
      )}

      {/* TEMPLATE 2: MODERN */}
      {template === 'modern' && (
         <div className="p-8">
            {/* Aapka modern wala code yahan aayega */}
         </div>
      )}

      {/* Baaki 17 templates ka code yahan aayega... (Aap purane builder se copy kar ke yahan paste kar dein) */}

    </div>
  );
}