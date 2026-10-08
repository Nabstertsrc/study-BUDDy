import React, { useState, useRef } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Camera, Save, Loader2, User, BookOpen, Building, Hash, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function Profile() {
  const { user, userProfile, updateProfile, logout } = useAuth();
  
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    full_name: userProfile?.full_name || '',
    student_no: userProfile?.student_no || '',
    course_of_study: userProfile?.course_of_study || '',
    institution: userProfile?.institution || '',
    photo_url: userProfile?.photo_url || ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    setIsUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const storageRef = ref(storage, `profiles/${user.uid}/avatar.${ext}`);
      
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      
      setFormData(prev => ({ ...prev, photo_url: downloadURL }));
      await updateProfile({ photo_url: downloadURL });
      
      toast.success('Profile picture updated successfully!');
    } catch (err) {
      console.error('Upload error:', err);
      toast.error('Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.full_name.trim()) {
      toast.error('Name is required');
      return;
    }

    setIsSaving(true);
    try {
      await updateProfile({
        full_name: formData.full_name,
        student_no: formData.student_no,
        course_of_study: formData.course_of_study,
        institution: formData.institution
      });
      toast.success('Profile updated successfully!');
    } catch (err) {
      console.error('Update error:', err);
      toast.error('Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-10 px-4 sm:px-6">
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-black text-slate-900">Your Profile</h1>
          <p className="text-slate-500 mt-2">Manage your personal information and academic details.</p>
        </div>
        <Button 
          variant="outline" 
          onClick={logout}
          className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center gap-6 mb-10">
          <div className="relative">
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden bg-slate-100 border-4 border-white shadow-lg flex flex-shrink-0 items-center justify-center relative">
              {formData.photo_url ? (
                <img src={formData.photo_url} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User className="w-12 h-12 text-slate-400" />
              )}
              {isUploading && (
                <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                </div>
              )}
            </div>
            
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 p-2.5 bg-blue-600 text-white rounded-full shadow-md hover:bg-blue-700 transition-colors"
              disabled={isUploading}
            >
              <Camera className="w-5 h-5" />
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*"
              onChange={handleFileSelect}
            />
          </div>
          <div className="text-center sm:text-left">
            <h2 className="text-xl font-bold text-slate-900">{formData.full_name || 'Set your name'}</h2>
            <p className="text-slate-500 text-sm">{user?.email}</p>
            <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold">
              {userProfile?.role || 'Learner'}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-slate-700 font-semibold flex items-center gap-2">
                <User className="w-4 h-4 text-slate-400" />
                Full Name <span className="text-red-500">*</span>
              </Label>
              <Input 
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                placeholder="e.g. John Doe"
                className="rounded-xl bg-slate-50"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-700 font-semibold flex items-center gap-2">
                <Hash className="w-4 h-4 text-slate-400" />
                Student Number <span className="text-slate-400 font-normal">(Optional)</span>
              </Label>
              <Input 
                name="student_no"
                value={formData.student_no}
                onChange={handleChange}
                placeholder="e.g. 12345678"
                className="rounded-xl bg-slate-50"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-slate-700 font-semibold flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-slate-400" />
                Course / What you are studying
              </Label>
              <Input 
                name="course_of_study"
                value={formData.course_of_study}
                onChange={handleChange}
                placeholder="e.g. BSc Computer Science"
                className="rounded-xl bg-slate-50"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-700 font-semibold flex items-center gap-2">
                <Building className="w-4 h-4 text-slate-400" />
                Institution
              </Label>
              <Input 
                name="institution"
                value={formData.institution}
                onChange={handleChange}
                placeholder="e.g. UNISA"
                className="rounded-xl bg-slate-50"
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <Button 
              type="submit" 
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-11 px-8 gap-2"
              disabled={isSaving}
            >
              {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
