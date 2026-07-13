import { useEffect, useState } from 'react';
import { listGalleryItems, saveGalleryItem, deleteGalleryItem } from '../data/api.js';
import { DEFAULT_GALLERY_ITEMS, GALLERY_CATEGORIES } from '../../lib/galleryItems.js';
import { Modal, EmptyState, Spinner } from '../components/ui.jsx';

const EMPTY_ITEM = {
  title: '',
  category: 'events',
  image: '',
  alt: '',
  lightboxTitle: '',
  description: '',
  published: true,
};

export default function GalleryAdmin() {
  const [items, setItems] = useState(null);
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);

  const refresh = () => listGalleryItems().then(setItems);
  useEffect(() => {
    refresh();
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await saveGalleryItem({ ...editing, alt: editing.alt || editing.title, lightboxTitle: editing.lightboxTitle || editing.title });
      setEditing(null);
      refresh();
    } finally {
      setBusy(false);
    }
  };

  const remove = async (item) => {
    if (!window.confirm(`Remove "${item.title}" from the gallery?`)) return;
    await deleteGalleryItem(item.id);
    refresh();
  };

  const togglePublish = async (item) => {
    await saveGalleryItem({ ...item, published: item.published === false });
    refresh();
  };

  if (!items) return <Spinner />;

  const set = (key) => (e) => setEditing((prev) => ({ ...prev, [key]: e.target.value }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <p className="text-sm text-gray-500 max-w-xl">
          Items added here appear on the public Gallery page when published. Use image paths under{' '}
          <code className="bg-gray-100 px-1 rounded">assets/gallery/</code> (e.g.{' '}
          <code className="bg-gray-100 px-1 rounded">assets/gallery/sports.png</code>) or full image URLs.
        </p>
        <button className="ams-btn-primary flex-shrink-0" onClick={() => setEditing({ ...EMPTY_ITEM })}>
          + Add Gallery Item
        </button>
      </div>

      <div className="ams-card">
        <h3 className="font-bold text-gray-800 mb-3">Built-in items (always shown)</h3>
        <div className="flex flex-wrap gap-3">
          {DEFAULT_GALLERY_ITEMS.map((item) => (
            <div key={item.id} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
              <img src={item.image} alt={item.alt} className="w-10 h-10 object-cover rounded" />
              <div>
                <p className="text-sm font-semibold text-gray-700">{item.title}</p>
                <p className="text-xs text-gray-400 capitalize">{item.category}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {items.length === 0 ? (
        <div className="ams-card">
          <EmptyState message="No managed gallery items yet." />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <div key={item.id} className="ams-card p-0 overflow-hidden">
              <div className="h-40 bg-gray-100">
                <img src={item.image} alt={item.alt} className="w-full h-full object-cover" />
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-bold text-gray-800">{item.title}</p>
                    <p className="text-xs text-gray-400 capitalize">{item.category}</p>
                  </div>
                  <button
                    onClick={() => togglePublish(item)}
                    className={`ams-badge ${item.published !== false ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}
                  >
                    {item.published !== false ? 'Public' : 'Hidden'}
                  </button>
                </div>
                {item.description && <p className="text-sm text-gray-600 mt-2 line-clamp-2">{item.description}</p>}
                <div className="mt-3 flex gap-3">
                  <button className="text-ois-blue text-sm font-semibold hover:underline" onClick={() => setEditing({ ...item })}>
                    Edit
                  </button>
                  <button className="ams-btn-danger" onClick={() => remove(item)}>
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <Modal title={editing.id ? 'Edit Gallery Item' : 'Add Gallery Item'} onClose={() => setEditing(null)}>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="ams-label">Title</label>
              <input required className="ams-input" value={editing.title} onChange={set('title')} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="ams-label">Category</label>
                <select className="ams-input" value={editing.category} onChange={set('category')}>
                  {GALLERY_CATEGORIES.filter((c) => c.value !== '*').map((category) => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="ams-label">Image Path / URL</label>
                <input required className="ams-input" value={editing.image} onChange={set('image')} placeholder="assets/gallery/…" />
              </div>
            </div>
            {editing.image && (
              <img src={editing.image} alt="Preview" className="h-32 rounded-lg object-cover" onError={(e) => (e.target.style.display = 'none')} />
            )}
            <div>
              <label className="ams-label">Caption / Description</label>
              <textarea className="ams-input" rows="2" value={editing.description} onChange={set('description')} />
            </div>
            <div className="flex items-center gap-2">
              <input
                id="gallery-published"
                type="checkbox"
                checked={editing.published !== false}
                onChange={(e) => setEditing((prev) => ({ ...prev, published: e.target.checked }))}
              />
              <label htmlFor="gallery-published" className="text-sm text-gray-600">
                Show on the public gallery
              </label>
            </div>
            <div className="flex justify-end gap-3">
              <button type="button" className="ams-btn-secondary" onClick={() => setEditing(null)}>
                Cancel
              </button>
              <button type="submit" disabled={busy} className="ams-btn-primary">
                {busy ? 'Saving…' : 'Save Item'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
