import React, { useState } from 'react';
import { MedicalDisposalRecord, House, CADET_HOUSES } from '../types/medical';
import { storageService } from '../services/storageService';
import { 
  Search, 
  Filter, 
  Printer, 
  Trash2, 
  Calendar, 
  User, 
  Clock, 
  CheckCircle, 
  FileSpreadsheet, 
  Database,
  Building,
  FileText
} from 'lucide-react';

interface DisposalRegisterProps {
  disposals: MedicalDisposalRecord[];
  onSelectRecordForSlip: (record: MedicalDisposalRecord) => void;
  onRefresh: () => void;
  onOpenFirebaseModal: () => void;
}

export const DisposalRegister: React.FC<DisposalRegisterProps> = ({
  disposals,
  onSelectRecordForSlip,
  onRefresh,
  onOpenFirebaseModal,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedHouse, setSelectedHouse] = useState<string>('All');
  const [selectedExcuse, setSelectedExcuse] = useState<string>('All');

  const filteredDisposals = disposals.filter((d) => {
    const matchesSearch =
      d.cadetNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.diagnosis.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesHouse = selectedHouse === 'All' || d.house === selectedHouse;
    const matchesExcuse = selectedExcuse === 'All' || d.excuseType === selectedExcuse;

    return matchesSearch && matchesHouse && matchesExcuse;
  });

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete the medical disposal record for ${name}?`)) {
      storageService.deleteDisposal(id);
      onRefresh();
    }
  };

  const handleStatusToggle = (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'Active' ? 'Completed' : 'Active';
    storageService.updateStatus(id, nextStatus as 'Active' | 'Completed');
    onRefresh();
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-slate-200/80 overflow-hidden">
      {/* Header with Search and Actions */}
      <div className="p-6 bg-slate-50 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-700" />
            Cadet Medical Disposal Register
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Active and archived excuse slips issued by the Infirmary / Medical Inspection Room.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={onOpenFirebaseModal}
            className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-900 border border-amber-300 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Database className="w-3.5 h-3.5 text-amber-700" />
            Firebase Integration Ready
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 sm:p-6 border-b border-slate-100 bg-white grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search Cadet No., Name, Diagnosis..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>

        {/* Filter House */}
        <div className="relative">
          <select
            value={selectedHouse}
            onChange={(e) => setSelectedHouse(e.target.value)}
            className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer font-medium"
          >
            <option value="All">All Houses (Razia, Sitara, Taramon)</option>
            {CADET_HOUSES.map((h) => (
              <option key={h} value={h}>
                {h}
              </option>
            ))}
          </select>
        </div>

        {/* Filter Excuse */}
        <div className="relative">
          <select
            value={selectedExcuse}
            onChange={(e) => setSelectedExcuse(e.target.value)}
            className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer font-medium"
          >
            <option value="All">All Excuses (Mosq, Shoe, Games)</option>
            <option value="Mosq">Mosq Excuse</option>
            <option value="Shoe">Shoe Excuse</option>
            <option value="Games">Games Excuse</option>
          </select>
        </div>
      </div>

      {/* Disposals Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs sm:text-sm">
          <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
            <tr>
              <th className="py-3 px-4">Cadet No. & Name</th>
              <th className="py-3 px-4">House & Class</th>
              <th className="py-3 px-4">Clinical Diagnosis</th>
              <th className="py-3 px-4">Excuse Granted</th>
              <th className="py-3 px-4">Valid Until Date</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredDisposals.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <FileText className="w-8 h-8 text-slate-300" />
                    <p className="font-semibold text-slate-700">No medical disposal slips match this filter.</p>
                    <p className="text-xs text-slate-400">Fill the Medical Disposal form above to issue a new excuse slip.</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredDisposals.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900 font-mono flex items-center gap-1.5">
                      <span className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-800 text-[11px]">
                        #{item.cadetNo}
                      </span>
                    </div>
                    <div className="font-semibold text-slate-800 mt-0.5">{item.name}</div>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-emerald-800">{item.house}</div>
                    <div className="text-xs text-slate-500">{item.className}</div>
                  </td>

                  <td className="py-3.5 px-4 max-w-xs">
                    <p className="text-slate-800 font-medium line-clamp-2">{item.diagnosis}</p>
                    {item.additionalRemarks && (
                      <p className="text-[11px] text-slate-500 italic mt-0.5 line-clamp-1">
                        Note: {item.additionalRemarks}
                      </p>
                    )}
                  </td>

                  <td className="py-3.5 px-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-md font-bold text-xs ${
                      item.excuseType === 'Mosq'
                        ? 'bg-purple-100 text-purple-800 border border-purple-200'
                        : item.excuseType === 'Shoe'
                        ? 'bg-amber-100 text-amber-800 border border-amber-200'
                        : 'bg-blue-100 text-blue-800 border border-blue-200'
                    }`}>
                      {item.excuseType}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {item.excuseDate}
                    </span>
                  </td>

                  <td className="py-3.5 px-4">
                    <button
                      onClick={() => handleStatusToggle(item.id, item.status)}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-bold cursor-pointer transition-colors ${
                        item.status === 'Active'
                          ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                          : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                      }`}
                      title="Click to toggle status"
                    >
                      ● {item.status}
                    </button>
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => onSelectRecordForSlip(item)}
                        className="p-1.5 text-slate-700 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                        title="View & Print Official Slip"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id, item.name)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Delete record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Info */}
      <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-500 gap-2">
        <span>
          Showing <strong>{filteredDisposals.length}</strong> of <strong>{disposals.length}</strong> total cadet medical records
        </span>
        <span className="text-[11px] text-slate-400">
          House Distribution: Razia ({disposals.filter(d => d.house === 'Razia House').length}) • 
          Sitara ({disposals.filter(d => d.house === 'Sitara House').length}) • 
          Taramon ({disposals.filter(d => d.house === 'Taramon House').length})
        </span>
      </div>
    </div>
  );
};
