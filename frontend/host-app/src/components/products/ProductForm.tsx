
// host-app/src/components/products/ProductForm.tsx
import { useState } from 'react';

interface Variation {
  label: string;
  price: number;
}

const ProductForm = () => {
  const [name, setName] = useState('');
  const [variations, setVariations] = useState<Variation[]>([{ label: '', price: 0 }]);

  const updateVariation = (index: number, key: keyof Variation, value: string | number) => {
    const updated = [...variations];
    updated[index][key] = key === 'price' ? parseFloat(value as string) : value as string;
    setVariations(updated);
  };

  const addVariation = () => {
    setVariations([...variations, { label: '', price: 0 }]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log({ name, variations });
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-xl shadow">
      <h2 className="text-2xl font-bold mb-4">🛒 Add Product (Host)</h2>
      <form onSubmit={handleSubmit} className="grid gap-4">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Product Name"
          className="border border-gray-300 rounded p-2"
        />
        <div className="grid gap-2">
          <label className="font-semibold">Variations</label>
          {variations.map((variation, index) => (
            <div key={index} className="flex gap-2">
              <input
                type="text"
                placeholder="Label"
                value={variation.label}
                onChange={(e) => updateVariation(index, 'label', e.target.value)}
                className="flex-1 border rounded p-2"
              />
              <input
                type="number"
                placeholder="Price"
                value={variation.price}
                onChange={(e) => updateVariation(index, 'price', e.target.value)}
                className="w-32 border rounded p-2"
              />
            </div>
          ))}
          <button type="button" onClick={addVariation} className="text-blue-600 mt-2">+ Add Variation</button>
        </div>
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Save Product</button>
      </form>
    </div>
  );
};

export default ProductForm;
