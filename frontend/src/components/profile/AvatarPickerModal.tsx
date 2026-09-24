'use client';

import React, { useState, useRef, ChangeEvent } from 'react';
import {
  X,
  UploadSimple,
  Sparkle,
  ArrowsClockwise,
  Check,
  WarningCircle,
  Camera,
} from '@phosphor-icons/react';
import { api } from '@/lib/api';

export interface AvatarPreset {
  id: string;
  name: string;
  url: string;
  category: string;
}

export const AVATAR_PRESETS: AvatarPreset[] = [
  {
    id: 'chi-chan',
    name: 'ChiChan Bé Vui',
    url: 'https://api.dicebear.com/7.x/bottts/svg?seed=ChiChan&backgroundColor=ffd5dc',
    category: 'Mascot',
  },
  {
    id: 'kham-pha',
    name: 'Bé Khám Phá',
    url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Explorer&backgroundColor=d1f4ff',
    category: 'Học sinh',
  },
  {
    id: 'tri-tue',
    name: 'Nhà Khoa Học',
    url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Scholar&backgroundColor=e8ddff',
    category: 'Tri thức',
  },
  {
    id: 'meo-thong-thai',
    name: 'Mèo Thông Thái',
    url: 'https://api.dicebear.com/7.x/bottts/svg?seed=SmartCat&backgroundColor=ffe8d6',
    category: 'Mascot',
  },
  {
    id: 'tu-tin',
    name: 'Bạn Nhỏ Tự Tin',
    url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Confident&backgroundColor=d8f3dc',
    category: 'Học sinh',
  },
  {
    id: 'dung-cam',
    name: 'Hiệp Sĩ Can Đảm',
    url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Brave&backgroundColor=ffe5ec',
    category: 'Học sinh',
  },
  {
    id: 'nang-dong',
    name: 'Bé Năng Động',
    url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Energetic&backgroundColor=ffedd8',
    category: 'Học sinh',
  },
  {
    id: 'hoa-dong',
    name: 'Bạn Thân Thiện',
    url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Friendly&backgroundColor=e0f2fe',
    category: 'Gia đình',
  },
  {
    id: 'ngoi-sao',
    name: 'Ngôi Sao Sáng',
    url: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=StarSparkle&backgroundColor=fef08a',
    category: 'Biểu tượng',
  },
  {
    id: 'mat-troi',
    name: 'Ánh Dương Ấm',
    url: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=SunnyJoy&backgroundColor=fed7aa',
    category: 'Biểu tượng',
  },
  {
    id: 'chu-dao',
    name: 'Phụ Huynh Chu Đáo',
    url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Caring&backgroundColor=fbcfe8',
    category: 'Phụ huynh',
  },
  {
    id: 'yeu-thuong',
    name: 'Trái Tim Yêu Thương',
    url: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=KindHeart&backgroundColor=fecdd3',
    category: 'Biểu tượng',
  },
];

export const DEFAULT_AVATAR_URL =
  'https://api.dicebear.com/7.x/bottts/svg?seed=ChiChan&backgroundColor=ffd5dc';

interface AvatarPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAvatar: string;
  onAvatarUpdated: (newAvatarUrl: string) => void;
}

export default function AvatarPickerModal({
  isOpen,
  onClose,
  currentAvatar,
  onAvatarUpdated,
}: AvatarPickerModalProps) {
  const [activeTab, setActiveTab] = useState<'upload' | 'presets'>('upload');
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>(currentAvatar || DEFAULT_AVATAR_URL);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (file: File) => {
    setErrorMessage(null);
    if (!file.type.match(/^image\/(jpeg|png|webp)$/i)) {
      setErrorMessage('Định dạng tệp không hợp lệ. Vui lòng chọn tệp JPG, PNG hoặc WEBP.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('Kích thước ảnh vượt quá 5MB. Vui lòng chọn ảnh nhẹ hơn.');
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleSaveUpload = async () => {
    if (!selectedFile) {
      setErrorMessage('Vui lòng chọn một tệp ảnh để tải lên.');
      return;
    }

    setIsUploading(true);
    setErrorMessage(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const res = await api.upload('/users/avatar', formData);
      if (res.success && res.data?.avatar_url) {
        onAvatarUpdated(res.data.avatar_url);
        onClose();
      } else {
        throw new Error(res.message || 'Lỗi khi tải ảnh lên máy chủ.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Không thể tải ảnh lên. Vui lòng thử lại.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSelectPreset = (preset: AvatarPreset) => {
    setSelectedPreset(preset.id);
    setPreviewUrl(preset.url);
    setErrorMessage(null);
  };

  const handleSavePreset = async () => {
    if (!selectedPreset) return;
    const preset = AVATAR_PRESETS.find((p) => p.id === selectedPreset);
    if (!preset) return;

    setIsUploading(true);
    setErrorMessage(null);

    try {
      const res = await api.put('/users/profile', { avatar_url: preset.url });
      if (res.success) {
        onAvatarUpdated(preset.url);
        onClose();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Lỗi khi cập nhật avatar mẫu.');
    } finally {
      setIsUploading(false);
    }
  };


  const handleResetToDefault = async () => {
    setIsUploading(true);
    setErrorMessage(null);
    try {
      const res = await api.put('/users/profile', { avatar_url: DEFAULT_AVATAR_URL });
      if (res.success) {
        onAvatarUpdated(DEFAULT_AVATAR_URL);
        onClose();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Lỗi khi khôi phục avatar mặc định.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
      <div
        className="w-full max-w-2xl bg-white border border-outline-variant/60 shadow-2xl rounded-none flex flex-col max-h-[90vh] overflow-hidden animate-page-appear"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/30 bg-surface-container-lowest">
          <div className="flex items-center gap-2">
            <Camera size={20} weight="duotone" className="text-primary" />
            <h2 className="text-base font-extrabold text-on-surface">Đổi ảnh đại diện</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
            aria-label="Đóng"
          >
            <X size={20} weight="bold" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-outline-variant/30 bg-surface-container-low px-6">
          <button
            onClick={() => {
              setActiveTab('upload');
              setErrorMessage(null);
            }}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-bold transition-colors border-b-2 cursor-pointer ${
              activeTab === 'upload'
                ? 'border-primary text-primary bg-white'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <UploadSimple size={16} weight="bold" />
            Tải ảnh từ máy
          </button>
          <button
            onClick={() => {
              setActiveTab('presets');
              setErrorMessage(null);
            }}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-bold transition-colors border-b-2 cursor-pointer ${
              activeTab === 'presets'
                ? 'border-primary text-primary bg-white'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <Sparkle size={16} weight="bold" />
            Avatar mẫu ({AVATAR_PRESETS.length})
          </button>

        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Error notice */}
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2 rounded-none">
              <WarningCircle size={18} weight="fill" className="shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Live Preview Bar */}
          <div className="flex items-center gap-5 p-4 bg-surface-container-lowest border border-outline-variant/30">
            <div className="relative w-20 h-20 shrink-0 border-2 border-primary/20 bg-surface-container-low overflow-hidden">
              <img
                src={previewUrl}
                alt="Xem trước avatar"
                className="w-full h-full object-cover"
                onError={() => setPreviewUrl(DEFAULT_AVATAR_URL)}
              />
            </div>
            <div className="flex-1 space-y-1">
              <p className="text-xs font-bold text-on-surface">Khung xem trước ảnh đại diện</p>
              <p className="text-[11px] text-on-surface-variant leading-relaxed">
                Ảnh sẽ hiển thị vuông sắc nét trong hồ sơ, bảng tin thảo luận và thanh điều hướng.
              </p>
            </div>
            <button
              onClick={handleResetToDefault}
              disabled={isUploading}
              title="Đặt lại ảnh mặc định"
              className="px-3 py-1.5 text-xs text-on-surface-variant hover:text-primary hover:bg-surface-container border border-outline-variant/40 flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 disabled:opacity-50"
            >
              <ArrowsClockwise size={14} weight="bold" />
              <span>Mặc định</span>
            </button>
          </div>

          {/* Tab 1: File Upload */}
          {activeTab === 'upload' && (
            <div className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileChange(e.target.files[0]);
                  }
                }}
              />

              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`p-8 border-2 border-dashed flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                  dragActive
                    ? 'border-primary bg-primary/5'
                    : 'border-outline-variant hover:border-primary hover:bg-surface-container-lowest'
                }`}
              >
                <div className="w-12 h-12 flex items-center justify-center text-primary bg-primary/10 mb-3">
                  <UploadSimple size={24} weight="bold" />
                </div>
                <p className="text-xs font-bold text-on-surface mb-1">
                  Kéo thả tệp ảnh vào đây hoặc bấm để chọn tệp
                </p>
                <p className="text-[11px] text-on-surface-variant">
                  Hỗ trợ định dạng JPG, PNG, WEBP (tối đa 5MB)
                </p>
                {selectedFile && (
                  <div className="mt-3 px-3 py-1 bg-primary/10 text-primary text-xs font-semibold">
                    Đã chọn: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={handleSaveUpload}
                  disabled={!selectedFile || isUploading}
                  className="px-6 py-2.5 bg-primary text-white text-xs font-bold hover:opacity-90 transition-all disabled:opacity-50 cursor-pointer flex items-center gap-2"
                >
                  {isUploading ? 'Đang nén & lưu ảnh...' : 'Tải lên & Lưu thay đổi'}
                  <Check size={16} weight="bold" />
                </button>
              </div>
            </div>
          )}

          {/* Tab 2: Presets Library */}
          {activeTab === 'presets' && (
            <div className="space-y-4">
              <p className="text-xs text-on-surface-variant">
                Lựa chọn avatar hoạt họa dễ thương, bảo mật danh tính dành cho học sinh và phụ huynh:
              </p>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                {AVATAR_PRESETS.map((preset) => {
                  const isSelected = selectedPreset === preset.id || previewUrl === preset.url;
                  return (
                    <button
                      key={preset.id}
                      onClick={() => handleSelectPreset(preset)}
                      className={`group p-2 border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                        isSelected
                          ? 'border-primary bg-primary/10 ring-2 ring-primary/30'
                          : 'border-outline-variant/40 hover:border-primary/60 bg-white'
                      }`}
                    >
                      <div className="w-14 h-14 overflow-hidden border border-outline-variant/30 bg-surface-container-low flex items-center justify-center">
                        <img
                          src={preset.url}
                          alt={preset.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          loading="lazy"
                        />
                      </div>
                      <span className="text-[10px] font-bold text-on-surface truncate w-full text-center">
                        {preset.name}
                      </span>
                      <span className="text-[9px] text-on-surface-variant/70">
                        {preset.category}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="flex justify-end pt-3">
                <button
                  onClick={handleSavePreset}
                  disabled={!selectedPreset || isUploading}
                  className="px-6 py-2.5 bg-primary text-white text-xs font-bold hover:opacity-90 transition-all disabled:opacity-50 cursor-pointer flex items-center gap-2"
                >
                  {isUploading ? 'Đang lưu avatar...' : 'Áp dụng avatar mẫu này'}
                  <Check size={16} weight="bold" />
                </button>
              </div>
            </div>
          )}


        </div>
      </div>
    </div>
  );
}
