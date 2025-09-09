import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SuccessModal({ isOpen, onClose }: SuccessModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm text-center" data-testid="modal-success">
        {/* Success SVG Animation */}
        <div className="mb-6">
          <svg 
            className="w-20 h-20 mx-auto text-secondary" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
            data-testid="icon-success"
          >
            <circle 
              cx="12" 
              cy="12" 
              r="10" 
              strokeWidth="2" 
              className="opacity-25"
            />
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth="2" 
              d="M9 12l2 2 4-4" 
              className="animate-draw"
            />
          </svg>
        </div>
        
        <h3 className="text-xl font-semibold text-secondary mb-2" data-testid="text-success-title">
          Order Placed Successfully!
        </h3>
        <p className="text-muted-foreground mb-6" data-testid="text-success-description">
          You'll receive an email confirmation shortly. The seller will contact you to arrange pickup.
        </p>
        <Button 
          onClick={onClose}
          data-testid="button-continue-shopping"
        >
          Continue Shopping
        </Button>
      </DialogContent>
    </Dialog>
  );
}
