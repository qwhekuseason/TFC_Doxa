import { Shield, Trash2, UserMinus } from 'lucide-react';

interface AdminControlsProps {
  onPromote?: () => void;
  onDelete?: () => void;
  onRemove?: () => void;
  isAdmin?: boolean;
}

export default function AdminControls({ 
  onPromote, 
  onDelete, 
  onRemove, 
  isAdmin 
}: AdminControlsProps) {
  if (!onPromote && !onDelete && !onRemove) return null;

  return (
    <div className="flex items-center space-x-2">
      {onPromote && !isAdmin && (
        <button
          onClick={onPromote}
          className="p-1 text-yellow-600 hover:text-yellow-700"
          title="Promote to Admin"
        >
          <Shield className="w-4 h-4" />
        </button>
      )}
      {onDelete && (
        <button
          onClick={onDelete}
          className="p-1 text-red-600 hover:text-red-700"
          title="Delete"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}
      {onRemove && (
        <button
          onClick={onRemove}
          className="p-1 text-red-600 hover:text-red-700"
          title="Remove User"
        >
          <UserMinus className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

