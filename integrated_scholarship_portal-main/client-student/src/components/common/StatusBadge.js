import React from 'react';
import { 
  CheckCircle2, 
  Clock, 
  Send, 
  Search, 
  Award, 
  FileCheck, 
  Banknote, 
  AlertTriangle, 
  XCircle,
  RefreshCw
} from 'lucide-react';

const StatusBadge = ({ status }) => {
  const getBadgeConfig = (st) => {
    switch (st) {
      case 'SUBMITTED':
        return {
          bg: '#eff6ff',
          text: '#1d4ed8',
          border: '#bfdbfe',
          dot: '#3b82f6',
          label: 'Submitted (Pending Institute)',
          icon: <Clock size={13} />
        };
      case 'INSTITUTE_VERIFIED':
        return {
          bg: '#ecfdf5',
          text: '#047857',
          border: '#a7f3d0',
          dot: '#10b981',
          label: 'Institute Verified',
          icon: <CheckCircle2 size={13} />
        };
      case 'ROUTED_TO_DEPARTMENT':
        return {
          bg: '#f5f3ff',
          text: '#6d28d9',
          border: '#ddd6fe',
          dot: '#8b5cf6',
          label: 'Routed to Department',
          icon: <Send size={13} />
        };
      case 'DEPARTMENT_VERIFICATION':
        return {
          bg: '#fffbeb',
          text: '#b45309',
          border: '#fde68a',
          dot: '#f59e0b',
          label: 'Department Scrutiny',
          icon: <Search size={13} />
        };
      case 'APPROVED':
      case 'DEPARTMENT_APPROVED':
        return {
          bg: '#f0fdf4',
          text: '#15803d',
          border: '#bbf7d0',
          dot: '#22c55e',
          label: 'Department Approved',
          icon: <Award size={13} />
        };
      case 'SANCTIONED':
        return {
          bg: '#faf5ff',
          text: '#7e22ce',
          border: '#e9d5ff',
          dot: '#a855f7',
          label: 'Sanction Order Issued',
          icon: <FileCheck size={13} />
        };
      case 'PAYMENT_PENDING':
        return {
          bg: '#fff7ed',
          text: '#c2410c',
          border: '#fed7aa',
          dot: '#f97316',
          label: 'Payment Queued',
          icon: <Clock size={13} />
        };
      case 'PAYMENT_PROCESSING':
        return {
          bg: '#f0f9ff',
          text: '#0369a1',
          border: '#bae6fd',
          dot: '#0ea5e9',
          label: 'Payment Processing',
          icon: <RefreshCw size={13} className="spin" />
        };
      case 'DISBURSED':
      case 'PAYMENT_DISBURSED':
        return {
          bg: '#ecfdf5',
          text: '#065f46',
          border: '#6ee7b7',
          dot: '#059669',
          label: 'Payment Disbursed',
          icon: <Banknote size={13} />
        };
      case 'CORRECTION_REQUIRED':
        return {
          bg: '#fff1f2',
          text: '#be123c',
          border: '#fecdd3',
          dot: '#f43f5e',
          label: 'Correction Required',
          icon: <AlertTriangle size={13} />
        };
      case 'REJECTED':
        return {
          bg: '#fef2f2',
          text: '#b91c1c',
          border: '#fecaca',
          dot: '#ef4444',
          label: 'Rejected',
          icon: <XCircle size={13} />
        };
      case 'SLA_BREACHED':
      case 'SLA DELAYED':
      case 'SLA_DELAYED':
        return {
          bg: '#fefce8',
          text: '#854d0e',
          border: '#fde047',
          dot: '#eab308',
          label: 'SLA Delayed (Breached)',
          icon: <AlertTriangle size={13} />
        };
      case 'SLA_WARNING':
        return {
          bg: '#fffbeb',
          text: '#b45309',
          border: '#fde68a',
          dot: '#f59e0b',
          label: 'SLA Warning',
          icon: <Clock size={13} />
        };
      case 'COMPLETED_AFTER_SLA':
        return {
          bg: '#fefce8',
          text: '#a16207',
          border: '#fef08a',
          dot: '#ca8a04',
          label: 'Completed (After SLA)',
          icon: <CheckCircle2 size={13} />
        };
      case 'COMPLETED_WITHIN_SLA':
        return {
          bg: '#ecfdf5',
          text: '#047857',
          border: '#a7f3d0',
          dot: '#10b981',
          label: 'Completed Within SLA',
          icon: <CheckCircle2 size={13} />
        };
      default:
        return {
          bg: '#f8fafc',
          text: '#475569',
          border: '#e2e8f0',
          dot: '#94a3b8',
          label: st || 'Unknown',
          icon: <Clock size={13} />
        };
    }
  };

  const config = getBadgeConfig(status);

  return (
    <span
      className="badge-status shadow-xs"
      style={{
        backgroundColor: config.bg,
        color: config.text,
        border: `1px solid ${config.border}`,
        fontWeight: 600,
        fontSize: '0.74rem',
        padding: '0.35rem 0.75rem',
        borderRadius: '30px',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.4rem',
        whiteSpace: 'nowrap'
      }}
    >
      <span
        style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          backgroundColor: config.dot,
          flexShrink: 0
        }}
      />
      <span className="d-flex align-items-center">{config.icon}</span>
      <span>{config.label}</span>
    </span>
  );
};

export default StatusBadge;
