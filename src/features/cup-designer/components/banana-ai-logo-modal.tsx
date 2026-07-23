"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Sparkles } from "lucide-react";
import { generateBananaLogoArtworkAsync } from "../services/artwork-generator.service";

interface BananaAiLogoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyLogo: (logoDataUrl: string, promptInfo: string) => void;
}

export function BananaAiLogoModal({ isOpen, onClose, onApplyLogo }: BananaAiLogoModalProps) {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedLogo, setGeneratedLogo] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    try {
      const dataUrl = await generateBananaLogoArtworkAsync({ brandName: prompt }, prompt);
      setGeneratedLogo(dataUrl);
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="size-5 text-emerald-600" />
            <span>Tạo Logo 100% Pure AI</span>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <Input
            placeholder="Nhập mô tả logo..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
          <Button onClick={handleGenerate} disabled={isGenerating} className="w-full">
            {isGenerating ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
            <span>Sinh logo AI</span>
          </Button>

          {generatedLogo && (
            <div className="space-y-2 text-center">
              <img src={generatedLogo} alt="AI Logo" className="mx-auto max-h-40 object-contain" />
              <Button
                onClick={() => {
                  onApplyLogo(generatedLogo, prompt);
                  onClose();
                }}
                className="w-full bg-emerald-600 text-white"
              >
                Dán lên ly 3D
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
