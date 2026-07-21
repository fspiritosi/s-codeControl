'use client';

import { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { Plus, Pencil, Ban, Check, X } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table';
import {
  getCustomerContacts,
  createContact,
  updateContact,
  deactivateContact,
} from '@/modules/commercial/features/customers/contacts.server';

type Contact = {
  id: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  contact_charge: string;
};

type Draft = Omit<Contact, 'id'>;
const emptyDraft: Draft = { contact_name: '', contact_email: '', contact_phone: '', contact_charge: '' };

export default function CustomerContactsManager({ customerId }: { customerId: string }) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const reload = useCallback(async () => {
    const data = await getCustomerContacts(customerId);
    setContacts(data as Contact[]);
    setLoading(false);
  }, [customerId]);

  useEffect(() => {
    reload();
  }, [reload]);

  if (loading) return <p className="text-sm text-muted-foreground">Cargando contactos…</p>;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Contactos</CardTitle>
        <Button type="button" size="sm" onClick={() => setAdding((v) => !v)}>
          <Plus className="mr-1 h-4 w-4" /> Nuevo contacto
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Cargo</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead className="w-[100px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {adding && (
              <ContactEditor
                onCancel={() => setAdding(false)}
                onSave={async (d) => {
                  const res = await createContact(customerId, d);
                  if (res.error) return toast.error(res.error);
                  toast.success('Contacto agregado');
                  setAdding(false);
                  reload();
                }}
              />
            )}
            {contacts.map((c) =>
              editingId === c.id ? (
                <ContactEditor
                  key={c.id}
                  initial={c}
                  onCancel={() => setEditingId(null)}
                  onSave={async (d) => {
                    const res = await updateContact(c.id, d);
                    if (res.error) return toast.error(res.error);
                    toast.success('Contacto actualizado');
                    setEditingId(null);
                    reload();
                  }}
                />
              ) : (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.contact_name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{c.contact_charge || '—'}</TableCell>
                  <TableCell className="text-sm">{c.contact_email || '—'}</TableCell>
                  <TableCell className="text-sm">{c.contact_phone || '—'}</TableCell>
                  <TableCell className="text-right">
                    <Button type="button" size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditingId(c.id)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      onClick={async () => {
                        const res = await deactivateContact(c.id);
                        if (res.error) return toast.error(res.error);
                        toast.success('Contacto eliminado');
                        reload();
                      }}
                    >
                      <Ban className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              )
            )}
            {contacts.length === 0 && !adding && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">
                  Este cliente no tiene contactos cargados.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function ContactEditor({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Contact;
  onSave: (d: Draft) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState<Draft>(initial ? { ...initial } : { ...emptyDraft });
  const set = (k: keyof Draft, v: string) => setDraft((d) => ({ ...d, [k]: v }));

  return (
    <TableRow>
      <TableCell>
        <Input className="h-8" value={draft.contact_name} onChange={(e) => set('contact_name', e.target.value)} placeholder="Nombre" />
      </TableCell>
      <TableCell>
        <Input className="h-8" value={draft.contact_charge} onChange={(e) => set('contact_charge', e.target.value)} placeholder="Cargo" />
      </TableCell>
      <TableCell>
        <Input className="h-8" value={draft.contact_email} onChange={(e) => set('contact_email', e.target.value)} placeholder="Email" />
      </TableCell>
      <TableCell>
        <Input className="h-8" value={draft.contact_phone} onChange={(e) => set('contact_phone', e.target.value)} placeholder="Teléfono" />
      </TableCell>
      <TableCell className="text-right">
        <Button type="button" size="icon" variant="ghost" className="h-7 w-7" onClick={() => onSave(draft)}>
          <Check className="h-4 w-4 text-green-600" />
        </Button>
        <Button type="button" size="icon" variant="ghost" className="h-7 w-7" onClick={onCancel}>
          <X className="h-4 w-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
}
