'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pencil, Plus, RefreshCw, Save, Store, Trash2, UserRoundCog, X } from 'lucide-react';
import { DataWorkspaceSkeleton } from '@/components/ui/skeletons';
import {
  createCanteenShop,
  deleteCanteenShop,
  getCanteenStore,
  updateCanteenShop,
  type CanteenShop,
  type CanteenShopInput,
  type CanteenStore,
  type ShopAssignmentRole,
} from '@/lib/campus-operations-api';

type UserOption = { id: string; name: string; email: string; role: string };

const emptyShop: CanteenShopInput = {
  shopKey: '', name: '', category: 'Canteen', description: '', isActive: true,
  mealCompliance: false, qrPayments: true, operators: [],
};

const messageOf = (error: unknown) => error instanceof Error ? error.message : 'The operation could not be completed.';
const slug = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 64);

export function VendorShopsWorkspace({ users, query }: { users: UserOption[]; query: string }) {
  const [data, setData] = useState<CanteenStore | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [editor, setEditor] = useState<CanteenShop | 'new' | null>(null);
  const [draft, setDraft] = useState<CanteenShopInput>(emptyShop);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getCanteenStore();
      setData(response.data);
      setError('');
    } catch (reason) {
      setError(messageOf(reason));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  // The API returns assignments as ids only, so names come from the directory
  // this workspace is already given.
  const directory = useMemo(() => new Map(users.map((user) => [user.id, user])), [users]);
  const nameOf = useCallback((userId: string) => directory.get(userId)?.name ?? userId, [directory]);

  const shops = useMemo(() => {
    const search = query.trim().toLowerCase();
    return (data?.shops ?? []).filter((shop) =>
      `${shop.name} ${shop.category} ${shop.description} ${(shop.operators ?? []).map((operator) => {
        const user = directory.get(operator.userId);
        return `${user?.name ?? operator.userId} ${user?.email ?? ''}`;
      }).join(' ')}`
        .toLowerCase().includes(search));
  }, [data?.shops, directory, query]);
  const operatorCount = useMemo(() => new Set((data?.shops ?? []).flatMap((shop) => (shop.operators ?? []).map((operator) => operator.userId))).size, [data?.shops]);
  const capabilities = data?.capabilities;

  const announce = (value: string) => {
    setNotice(value);
    window.setTimeout(() => setNotice(''), 3500);
  };

  const openEditor = (shop?: CanteenShop) => {
    setEditor(shop ?? 'new');
    setDraft(shop ? {
      shopKey: shop.shopKey,
      name: shop.name,
      category: shop.category,
      description: shop.description,
      isActive: shop.isActive,
      mealCompliance: shop.mealCompliance,
      qrPayments: shop.qrPayments,
      operators: (shop.operators ?? []).map((operator) => ({
        userId: operator.userId,
        assignmentRole: operator.assignmentRole === 'captain' ? 'captain' : 'owner',
      })),
    } : emptyShop);
  };

  const saveShop = async () => {
    if (!draft.name.trim()) return setError('Shop name is required.');
    if (!(draft.operators ?? []).length) return setError('Assign at least one owner or captain to this shop.');
    const value = { ...draft, shopKey: draft.shopKey || slug(draft.name) };
    setSaving(true);
    try {
      if (editor === 'new') await createCanteenShop(value);
      else if (editor) await updateCanteenShop(editor.id, value);
      setEditor(null);
      announce(editor === 'new' ? 'Shop created and assigned.' : 'Shop configuration updated.');
      await load();
    } catch (reason) {
      setError(messageOf(reason));
    } finally {
      setSaving(false);
    }
  };

  const removeShop = async (shop: CanteenShop) => {
    if (!window.confirm(`Deactivate ${shop.name}? It will disappear from assigned vendor and student app views.`)) return;
    try {
      await deleteCanteenShop(shop.id);
      announce('Shop deactivated.');
      await load();
    } catch (reason) {
      setError(messageOf(reason));
    }
  };

  const setOperator = (userId: string, enabled: boolean, assignmentRole: ShopAssignmentRole) => {
    const current = draft.operators ?? [];
    setDraft({
      ...draft,
      operators: enabled
        ? [...current.filter((operator) => operator.userId !== userId), { userId, assignmentRole }]
        : current.filter((operator) => operator.userId !== userId),
    });
  };

  if (loading) return <DataWorkspaceSkeleton rows={5} />;

  return <div className="flex min-h-0 flex-1 flex-col bg-[var(--crm-card)]">
    <style jsx global>{`
      .shop-input { height: 2.5rem; width: 100%; border: 1px solid var(--crm-border); border-radius: .375rem; background: transparent; padding: 0 .75rem; color: var(--crm-text); font-size: .75rem; outline: none; }
      .shop-input:focus { border-color: var(--crm-text); }
    `}</style>
    {(error || notice) && <div role="status" className={`mx-5 mt-4 flex items-center justify-between rounded-md border px-4 py-3 text-xs ${error ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
      <span>{error || notice}</span><button type="button" title="Dismiss" onClick={() => { setError(''); setNotice(''); }}><X size={15} /></button>
    </div>}

    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--crm-border)] px-5 py-5">
      <div><h2 className="text-base font-semibold">Vendor management</h2><p className="mt-1 text-xs text-[var(--crm-muted)]">Configure campus shops and explicitly assign each owner or captain. Vendor operations remain in the mobile app.</p></div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-[var(--crm-muted)]">{(data?.shops ?? []).filter((shop) => shop.isActive).length} active shops / {operatorCount} operators</span>
        <button type="button" title="Refresh shops" onClick={() => void load()} className="grid h-9 w-9 place-items-center rounded-md border border-[var(--crm-border)] hover:bg-[var(--crm-panel)]"><RefreshCw size={15} /></button>
        {capabilities?.createShops && <button type="button" onClick={() => openEditor()} className="inline-flex h-9 items-center gap-2 rounded-md bg-black px-4 text-xs font-semibold text-white"><Plus size={15} />Add shop</button>}
      </div>
    </header>

    <div className="min-h-0 flex-1 overflow-auto p-5">
      <div className="overflow-x-auto border-y border-[var(--crm-border)]">
        <div className="grid min-w-[900px] grid-cols-[1.25fr_.65fr_.8fr_1.5fr_.55fr_.35fr] px-4 py-3 text-[10px] uppercase text-[var(--crm-muted)]"><span>Shop</span><span>Category</span><span>Shop key</span><span>Assigned operators</span><span>Status</span><span /></div>
        {shops.map((shop) => <div key={shop.id} className="grid min-w-[900px] grid-cols-[1.25fr_.65fr_.8fr_1.5fr_.55fr_.35fr] items-center border-t border-[var(--crm-border)] px-4 py-4 text-xs">
          <span><strong className="block text-sm">{shop.name}</strong><small className="text-[var(--crm-muted)]">{shop.description || 'No description'}</small></span><span>{shop.category}</span><code>{shop.shopKey}</code>
          <span className="flex flex-wrap gap-1">{(shop.operators ?? []).length ? (shop.operators ?? []).map((operator) => <span key={operator.userId} className="rounded border border-[var(--crm-border)] px-2 py-1">{nameOf(operator.userId)} / {operator.assignmentRole}</span>) : <span className="text-amber-700">Unassigned</span>}</span>
          <span>{shop.isActive ? 'Active' : 'Inactive'}</span><span className="flex justify-end gap-1">{capabilities?.updateShops && <IconButton title="Edit shop and assignments" icon={Pencil} onClick={() => openEditor(shop)} />}{capabilities?.deleteShops && shop.isActive && <IconButton title="Deactivate shop" icon={Trash2} danger onClick={() => void removeShop(shop)} />}</span>
        </div>)}
        {!shops.length && <div className="grid min-h-32 place-items-center border-t border-[var(--crm-border)] text-xs text-[var(--crm-muted)]">No shops match this view.</div>}
      </div>
    </div>

    {editor && <Editor title={editor === 'new' ? 'Add shop' : 'Edit shop'} saving={saving} onClose={() => setEditor(null)} onSave={() => void saveShop()}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Shop name"><input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value, ...(editor === 'new' ? { shopKey: slug(event.target.value) } : {}) })} className="shop-input" /></Field>
        <Field label="Shop key"><input value={draft.shopKey} onChange={(event) => setDraft({ ...draft, shopKey: slug(event.target.value) })} className="shop-input" /></Field>
        <Field label="Category"><input value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value })} placeholder="Canteen, Stationery, Pharmacy..." className="shop-input" /></Field>
        <Field label="Description"><input value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} className="shop-input" /></Field>
        <CheckField label="Active" checked={draft.isActive} onChange={(value) => setDraft({ ...draft, isActive: value })} /><CheckField label="QR payments" checked={draft.qrPayments} onChange={(value) => setDraft({ ...draft, qrPayments: value })} />
      </div>
      <section className="mt-6 border-t border-[var(--crm-border)] pt-5">
        <div className="mb-3 flex items-center gap-2"><UserRoundCog size={16} /><div><h3 className="text-sm font-semibold">Shop operators</h3><p className="text-[11px] text-[var(--crm-muted)]">Only selected users can operate this shop in the app.</p></div></div>
        <div className="max-h-64 overflow-auto border-y border-[var(--crm-border)]">
          {users.map((user) => {
            const operator = (draft.operators ?? []).find((value) => value.userId === user.id);
            return <div key={user.id} className="grid grid-cols-[1fr_auto] items-center gap-3 border-b border-[var(--crm-border)] px-3 py-3 last:border-b-0">
              <label className="flex min-w-0 items-center gap-3 text-xs"><input type="checkbox" checked={Boolean(operator)} onChange={(event) => setOperator(user.id, event.target.checked, operator?.assignmentRole ?? 'owner')} /><span className="min-w-0"><strong className="block truncate text-sm">{user.name}</strong><small className="block truncate text-[var(--crm-muted)]">{user.email} · {user.role}</small></span></label>
              <select aria-label={`Operator role for ${user.name}`} disabled={!operator} value={operator?.assignmentRole ?? 'owner'} onChange={(event) => setOperator(user.id, true, event.target.value as ShopAssignmentRole)} className="h-8 rounded border border-[var(--crm-border)] bg-transparent px-2 text-xs disabled:opacity-40"><option value="owner">Owner</option><option value="captain">Captain</option></select>
            </div>;
          })}
          {!users.length && <div className="p-5 text-center text-xs text-[var(--crm-muted)]">Create or import users before assigning shop operators.</div>}
        </div>
      </section>
    </Editor>}
  </div>;
}

function IconButton({ title, icon: Icon, danger, onClick }: { title: string; icon: typeof Store; danger?: boolean; onClick: () => void }) { return <button type="button" title={title} aria-label={title} onClick={onClick} className={`grid h-8 w-8 place-items-center rounded-md border ${danger ? 'border-red-200 text-red-600 hover:bg-red-50' : 'border-[var(--crm-border)] hover:bg-[var(--crm-panel)]'}`}><Icon size={14} /></button>; }
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block text-[11px] font-medium text-[var(--crm-muted)]">{label}<span className="mt-1 block">{children}</span></label>; }
function CheckField({ label, checked, onChange }: { label: string; checked: boolean | undefined; onChange: (value: boolean) => void }) { return <label className="flex h-10 items-center gap-2 rounded-md border border-[var(--crm-border)] px-3 text-xs"><input type="checkbox" checked={Boolean(checked)} onChange={(event) => onChange(event.target.checked)} />{label}</label>; }
function Editor({ title, saving, onClose, onSave, children }: { title: string; saving: boolean; onClose: () => void; onSave: () => void; children: React.ReactNode }) { return <div className="fixed inset-0 z-[120] grid place-items-center bg-black/40 p-4"><section role="dialog" aria-modal="true" aria-label={title} className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-md bg-[var(--crm-card)] shadow-2xl"><header className="flex items-center justify-between border-b border-[var(--crm-border)] px-5 py-4"><h2 className="text-base font-semibold">{title}</h2><button type="button" title="Close" onClick={onClose}><X size={18} /></button></header><div className="overflow-auto p-5">{children}</div><footer className="flex justify-end gap-2 border-t border-[var(--crm-border)] px-5 py-4"><button type="button" onClick={onClose} className="h-9 rounded-md border border-[var(--crm-border)] px-4 text-xs">Cancel</button><button disabled={saving} type="button" onClick={onSave} className="inline-flex h-9 items-center gap-2 rounded-md bg-black px-4 text-xs font-semibold text-white disabled:opacity-50"><Save size={14} />Save</button></footer></section></div>; }
