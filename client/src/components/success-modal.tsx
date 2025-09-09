import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SuccessModal({ isOpen, onClose }: SuccessModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md text-center bg-white/95 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl" data-testid="modal-success">
        {/* Success Animation */}
        <div className="mb-8">
          <div className="w-24 h-24 mx-auto bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg animate-bounce">
            <svg 
              className="w-12 h-12 text-white" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              data-testid="icon-success"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth="3" 
                d="M5 13l4 4L19 7" 
                className="animate-draw"
              />
            </svg>
          </div>
        </div>
        
        <h3 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-4" data-testid="text-success-title">
          🎉 Order Placed Successfully!
        </h3>
        <p className="text-gray-600 mb-8 leading-relaxed" data-testid="text-success-description">
          You'll receive an email confirmation shortly. The seller will contact you to arrange pickup and payment details.
        </p>
        <Button 
          onClick={onClose}
          className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-300"
          data-testid="button-continue-shopping"
        >
          🛍️ Continue Shopping
        </Button>
      </DialogContent>
    </Dialog>
  );
}
