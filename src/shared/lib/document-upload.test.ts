import { describe, it, expect, vi, beforeEach } from 'vitest';

const upload = vi.fn();
const remove = vi.fn();
vi.mock('@/shared/lib/storage', () => ({
  storage: {
    upload: (...args: unknown[]) => upload(...args),
    remove: (...args: unknown[]) => remove(...args),
  },
}));

const { uploadDocumentFile, uploadDocumentWithFile } = await import('./document-upload');

describe('uploadDocumentFile', () => {
  beforeEach(() => {
    upload.mockReset();
  });

  it('devuelve el resultado de la subida', async () => {
    upload.mockResolvedValue({ path: 'empresa/equipos/ab123cd/seguro-(v0).pdf' });

    await expect(uploadDocumentFile(new File([''], 'a.pdf'), 'ruta.pdf')).resolves.toEqual({
      path: 'empresa/equipos/ab123cd/seguro-(v0).pdf',
    });
  });

  // Antes devolvia [] cuando el storage fallaba, asi que quien la llamaba
  // seguia como si todo hubiera salido bien y mostraba "cargado correctamente"
  // con el archivo sin subir (TKT-646).
  it('propaga el error del storage en lugar de devolver un valor vacio', async () => {
    upload.mockImplementation(async () => {
      throw new Error('Invalid key: transporte-sp-(30711588473)/equipos/...');
    });

    await expect(uploadDocumentFile(new File([''], 'a.pdf'), 'ruta.pdf')).rejects.toThrow('Invalid key');
  });
});

describe('uploadDocumentWithFile', () => {
  const file = () => new File([''], 'a.pdf');

  beforeEach(() => {
    upload.mockReset();
    remove.mockReset();
    upload.mockResolvedValue({ path: 'ruta.pdf' });
    remove.mockResolvedValue([]);
  });

  it('sube el archivo antes de registrar el documento', async () => {
    const orden: string[] = [];
    upload.mockImplementation(async () => {
      orden.push('storage');
      return { path: 'ruta.pdf' };
    });

    await uploadDocumentWithFile({
      file: file(),
      path: 'ruta.pdf',
      saveDocument: async () => {
        orden.push('base');
      },
    });

    expect(orden).toEqual(['storage', 'base']);
  });

  // El sintoma del TKT-646: la fila se creaba primero y el fallo del storage
  // se perdia, dejando un documento "presentado" sin archivo detras.
  it('no registra el documento si falla la subida del archivo', async () => {
    upload.mockImplementation(async () => {
      throw new Error('Invalid key');
    });
    const saveDocument = vi.fn();

    await expect(uploadDocumentWithFile({ file: file(), path: 'ruta.pdf', saveDocument })).rejects.toThrow(
      'Invalid key'
    );
    expect(saveDocument).not.toHaveBeenCalled();
  });

  it('borra el archivo subido si falla el registro en la base', async () => {
    await expect(
      uploadDocumentWithFile({
        file: file(),
        path: 'ruta.pdf',
        saveDocument: async () => {
          throw new Error('Error al insertar documento');
        },
      })
    ).rejects.toThrow('Error al insertar documento');

    expect(remove).toHaveBeenCalledWith('document_files', ['ruta.pdf']);
  });

  it('deja pasar el error del registro aunque no se pueda borrar el archivo', async () => {
    remove.mockImplementation(async () => {
      throw new Error('no se pudo borrar');
    });

    await expect(
      uploadDocumentWithFile({
        file: file(),
        path: 'ruta.pdf',
        saveDocument: async () => {
          throw new Error('Error al insertar documento');
        },
      })
    ).rejects.toThrow('Error al insertar documento');
  });
});
