export default function Sidebar({ categories, selected, onChange }) {
    return (
        <div className="w-64 h-[calc(100vh-100px)] sticky top-24 overflow-y-auto border rounded-xl p-4 bg-white space-y-4">

            <h2 className="font-bold mb-2">Etalase Toko</h2>

            <h3 className="font-semibold">Kategori</h3>
            <div className="space-y-2">
                {categories.map((cat) => (
                    <label key={cat} className="flex items-center space-x-2 cursor-pointer select-none">
                        <input
                            type="checkbox"
                            checked={selected.includes(cat)}
                            onChange={() => onChange(cat)}
                            className="accent-amber-600"
                        />
                        <span>{cat}</span>
                    </label>
                ))}
            </div>

            {selected.length > 0 && (
                <button
                    onClick={() => onChange(null)}
                    className="text-xs text-blue-500 hover:underline mt-2"
                >
                    Reset Filter
                </button>
            )}

        </div>
    );
}
