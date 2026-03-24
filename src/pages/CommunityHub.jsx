import React, { useState, useEffect } from "react";
import { collection, addDoc, query, getDocs, orderBy, serverTimestamp } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, Upload, Search, Download, Users, FileText, Tag, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { localApi } from "@/api/localApi";

export default function CommunityHub() {
    const [materials, setMaterials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    // Upload form state
    const [file, setFile] = useState(null);
    const [courseCode, setCourseCode] = useState("");
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");

    useEffect(() => {
        fetchMaterials();
    }, []);

    const fetchMaterials = async () => {
        setLoading(true);
        try {
            const q = query(collection(db, "public_materials"), orderBy("createdAt", "desc"));
            const querySnapshot = await getDocs(q);
            const fetched = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setMaterials(fetched);
        } catch (error) {
            console.error("Error fetching materials: ", error);
            toast.error("Failed to load community resources.");
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!file || !courseCode || !title) {
            toast.error("Please provide a file, course code, and title.");
            return;
        }
        if (!auth.currentUser) {
            toast.error("You must be logged in to share materials.");
            return;
        }

        setUploading(true);
        try {
            // Use existing base44 file upload to get URL
            const { file_url } = await localApi.integrations.Core.UploadFile({ file });

            const docData = {
                title,
                courseCode: courseCode.toUpperCase(),
                description,
                fileUrl: file_url,
                fileName: file.name,
                uploadedBy: auth.currentUser.email || "Anonymous Student",
                createdAt: serverTimestamp(),
                type: "Public Resource"
            };

            await addDoc(collection(db, "public_materials"), docData);

            toast.success("Material shared successfully with the community!");

            // Reset form
            setFile(null);
            setCourseCode("");
            setTitle("");
            setDescription("");

            // Refresh list
            fetchMaterials();
        } catch (error) {
            console.error("Upload error:", error);
            toast.error("Failed to upload material. Please try again.");
        } finally {
            setUploading(false);
        }
    };

    const filteredMaterials = materials.filter(m =>
        m.courseCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.title?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 text-indigo-600 mb-2">
                        <Users className="w-4 h-4" />
                        <span className="text-sm font-medium">Community Sharing</span>
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                        Student Resource Hub
                    </h1>
                    <p className="text-slate-500 mt-1">
                        Download resources uploaded by other students or share yours for specific modules.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Upload Column */}
                <div className="lg:col-span-1">
                    <Card className="border-indigo-100 shadow-lg sticky top-24">
                        <CardHeader className="bg-gradient-to-br from-indigo-50 to-white rounded-t-xl border-b border-indigo-50">
                            <CardTitle className="text-xl flex items-center gap-2 text-indigo-900">
                                <Upload className="w-5 h-5 text-indigo-600" />
                                Share Material
                            </CardTitle>
                            <CardDescription>
                                Upload notes or study guides. They will be labeled as "Public Resource" to avoid confusion.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <form onSubmit={handleUpload} className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Module Code (e.g. GGH1501)</Label>
                                    <Input
                                        placeholder="GGH1501"
                                        value={courseCode}
                                        onChange={(e) => setCourseCode(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Resource Title</Label>
                                    <Input
                                        placeholder="Chapter 1-3 Summary"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Description (Optional)</Label>
                                    <Input
                                        placeholder="Brief overview of content"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2 pt-2">
                                    <Label>Select File</Label>
                                    <Input
                                        type="file"
                                        onChange={(e) => setFile(e.target.files[0])}
                                        required
                                        className="cursor-pointer"
                                    />
                                </div>
                                <div className="pt-4">
                                    <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700" disabled={uploading}>
                                        {uploading ? (
                                            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading...</>
                                        ) : (
                                            "Publish to Community"
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>

                {/* Browser Column */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
                        <Search className="w-5 h-5 text-slate-400" />
                        <Input
                            placeholder="Search by Module Code (e.g. GGH1501) or Title..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="border-0 shadow-none focus-visible:ring-0 text-lg"
                        />
                    </div>

                    <div className="space-y-4">
                        {loading ? (
                            <div className="py-20 flex justify-center w-full">
                                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                            </div>
                        ) : filteredMaterials.length === 0 ? (
                            <div className="bg-slate-50 border border-dashed border-slate-300 rounded-2xl p-12 text-center">
                                <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                                <h3 className="text-lg font-bold text-slate-600">No resources found</h3>
                                <p className="text-slate-500 max-w-sm mx-auto mt-2">
                                    Be the first to upload and share study materials for this module!
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {filteredMaterials.map((material) => (
                                    <Card key={material.id} className="hover:shadow-md transition-shadow flex flex-col group border-slate-200">
                                        <CardHeader className="pb-3 flex-1">
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-100 text-indigo-800 text-xs font-bold uppercase tracking-widest border border-indigo-200/50">
                                                    <Tag className="w-3 h-3" />
                                                    {material.courseCode}
                                                </span>
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-semibold border border-amber-200">
                                                    <Users className="w-3 h-3" />
                                                    Public Resource
                                                </span>
                                            </div>
                                            <CardTitle className="text-lg line-clamp-2">{material.title}</CardTitle>
                                            <CardDescription className="line-clamp-2 mt-1">
                                                {material.description || "No description provided."}
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent className="pt-0 border-t border-slate-50 mt-auto flex flex-col gap-4">
                                            <div className="flex items-center gap-2 pt-3">
                                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs uppercase">
                                                    {material.uploadedBy?.charAt(0) || "U"}
                                                </div>
                                                <div className="text-xs text-slate-500">
                                                    Shared by <span className="font-medium text-slate-700">{material.uploadedBy?.split('@')[0]}</span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <Button variant="outline" className="flex-1 border-indigo-200 text-indigo-700 hover:bg-indigo-50" asChild>
                                                    <a href={material.fileUrl} target="_blank" rel="noopener noreferrer">
                                                        <Download className="w-4 h-4 mr-2" />
                                                        Download
                                                    </a>
                                                </Button>
                                                <Button variant="default" className="flex-1 bg-slate-900 hover:bg-slate-800 text-white" onClick={async () => {
                                                    try {
                                                        const existingMods = await localApi.entities.Module.filter({ code: material.courseCode });
                                                        let mId = existingMods.length > 0 ? existingMods[0].id : null;
                                                        if (!mId) {
                                                            const newMod = await localApi.entities.Module.create({
                                                                code: material.courseCode,
                                                                title: `Community: ${material.courseCode}`,
                                                                progress: 0
                                                            });
                                                            mId = newMod.id;
                                                        }

                                                        await localApi.entities.StudyMaterial.create({
                                                            title: `[Community] ${material.courseCode}: ${material.title}`,
                                                            file_url: material.fileUrl,
                                                            type: 'pdf',
                                                            module_id: mId,
                                                            content: material.description || 'Downloaded from community',
                                                            is_processed: false
                                                        });
                                                        toast.success("Added to your personal library!");
                                                    } catch (err) {
                                                        toast.error("Failed to add to library.");
                                                    }
                                                }}>
                                                    Use in Lab <ArrowRight className="w-3 h-3 ml-2" />
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
