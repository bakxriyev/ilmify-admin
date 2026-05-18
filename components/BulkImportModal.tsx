'use client';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { useRef } from 'react';

interface BulkImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bulkData: Array<{
    name: string;
    title?: string;
    description?: string;
    unit_number?: string;
    level_id?: number;
  }>;
  selectedLevelName?: string;
  loading: boolean;
  onBulkCreate: () => void;
  onCancel: () => void;
}

export function BulkImportModal({
  open,
  onOpenChange,
  bulkData,
  selectedLevelName,
  loading,
  onBulkCreate,
  onCancel,
}: BulkImportModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[80vh] bg-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-900">Excel dan Import</DialogTitle>
          <DialogDescription className="text-gray-600">
            {bulkData.length} ta unit topildi. Ko'rib chiqib import qiling.
            {selectedLevelName && (
              <p className="text-green-600 text-sm mt-1">
                Barcha unitlar avtomatik ravishda "{selectedLevelName}" leveliga biriktiriladi.
              </p>
            )}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <div className="overflow-x-auto border border-gray-200 rounded-lg max-h-96">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left py-2 px-4 font-medium text-gray-700">#</th>
                  <th className="text-left py-2 px-4 font-medium text-gray-700">Nomi</th>
                  <th className="text-left py-2 px-4 font-medium text-gray-700">Raqam</th>
                  <th className="text-left py-2 px-4 font-medium text-gray-700">Tavsif</th>
                  <th className="text-left py-2 px-4 font-medium text-gray-700">Level ID</th>
                </tr>
              </thead>
              <tbody>
                {bulkData.map((unit, index) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-2 px-4 text-gray-600">{index + 1}</td>
                    <td className="py-2 px-4 font-medium">{unit.name}</td>
                    <td className="py-2 px-4">{unit.unit_number}</td>
                    <td className="py-2 px-4 text-sm text-gray-600">{unit.description}</td>
                    <td className="py-2 px-4">{unit.level_id || (selectedLevelName ? '—' : unit.level_id)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={loading}
          >
            Bekor qilish
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700" onClick={onBulkCreate} disabled={loading || bulkData.length === 0}>
            {loading ? (
              <><RefreshCw className="h-4 w-4 animate-spin mr-2" />Import qilinmoqda...</>
            ) : (
              `${bulkData.length} Unitni Import Qilish`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}