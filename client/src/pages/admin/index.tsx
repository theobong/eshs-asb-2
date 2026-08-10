import React, { useState, useEffect } from 'react';
import { useLocation } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, Edit, Trash2, Package, Calendar, Info, FileText, Check, X, Eye, Users, DollarSign, LogOut, ArrowUp, ArrowDown } from 'lucide-react';
import { PrimaryButton, OutlineButton } from '@/components/ThemedComponents';
import { AdminAuth } from '@/components/AdminAuth';
import { FileUpload } from '@/components/FileUpload';
import {
  getProducts, createProduct, updateProduct, deleteProduct,
  getEvents, createEvent, updateEvent, deleteEvent,
  getVideos, createVideo, updateVideo, deleteVideo,
  getAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement,
  getStudentGovPositions, createStudentGovPosition, updateStudentGovPosition, deleteStudentGovPosition,
  getClubs, createClub, updateClub, deleteClub,
  getFormSubmissions, updateFormSubmission,
  getPurchases,
  Product, Event, VideoPost, Announcement, StudentGovPosition, Club, FormSubmission, FormSubmissionStatus, Purchase
} from '@/lib/api';
import OrdersManagement from '@/components/admin/OrdersManagement';

const GLASS_FIELD_CLASS = "bg-white/[0.02] backdrop-blur-3xl border border-white/10 text-white placeholder-gray-400";

const ICON_BUTTON_CLASS = "h-11 w-11 md:h-8 md:w-8 p-0";

const TAB_TRIGGER_CLASS = "flex-shrink-0 whitespace-nowrap gap-1.5 min-h-11 px-3 py-2 text-xs md:text-sm text-white";

function TextField({ label, value, onChange, placeholder, required, type, step }: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  type?: string;
  step?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-white mb-2">{label}</label>
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        step={step}
        className={GLASS_FIELD_CLASS}
      />
    </div>
  );
}

function TextAreaField({ label, value, onChange, placeholder, required, rows }: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  rows?: number;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-white mb-2">{label}</label>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        rows={rows}
        className={GLASS_FIELD_CLASS}
      />
    </div>
  );
}

function BackgroundVideo() {
  return (
    <div className="fixed inset-0 w-full h-full overflow-hidden -z-10">
      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute top-1/2 left-1/2 min-w-full min-h-full w-auto h-auto transform -translate-x-1/2 -translate-y-1/2 object-cover"
      >
      </video>
    </div>
  );
}

function resolveEventId(eventId: FormSubmission['eventId']): string | undefined {
  if (eventId && typeof eventId === 'object') {
    return (eventId as { _id?: string })._id;
  }
  return eventId;
}

function getSubmissionStatusColor(status: FormSubmissionStatus) {
  switch (status) {
    case 'pending': return "bg-yellow-600/20 border-yellow-600 text-yellow-200";
    case 'approved': return "bg-orange-500/20 border-orange-500 text-orange-200";
    case 'paid': return "bg-green-600/20 border-green-600 text-green-200";
    case 'rejected': return "bg-red-600/20 border-red-600 text-red-200";
    default: return "bg-gray-600/20 border-gray-600 text-gray-200";
  }
}

function getSubmissionStatusLabel(status: FormSubmissionStatus) {
  switch (status) {
    case 'approved': return 'Approved (Unpaid)';
    case 'paid': return 'Paid';
    default: return status;
  }
}

function getLowestTicketPrice(event: Event): number {
  const prices = (event.ticketTypes || []).map(ticket => ticket.price);
  return prices.length > 0 ? Math.min(...prices) : 0;
}

function VideoForm({ video, onSubmit, onCancel }: {
  video?: VideoPost;
  onSubmit: (data: Partial<VideoPost>) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState<Partial<VideoPost>>(
    video || {
      title: '',
      description: '',
      videoUrl: '',
      thumbnailUrl: '',
      date: new Date(),
      author: 'Admin',
      category: 'General',
      views: 0,
      featured: false
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <TextField
        label="Video Title"
        value={formData.title || ''}
        onChange={(value) => setFormData({...formData, title: value})}
        placeholder="Enter video title"
        required
      />

      <TextAreaField
        label="Description"
        value={formData.description || ''}
        onChange={(value) => setFormData({...formData, description: value})}
        placeholder="Video description"
        required
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <TextField
          label="Video URL"
          value={formData.videoUrl || ''}
          onChange={(value) => setFormData({...formData, videoUrl: value})}
          placeholder="URL to video"
          required
        />
        <div>
          <FileUpload
            value={formData.thumbnailUrl || ''}
            onChange={(url) => setFormData({...formData, thumbnailUrl: url})}
            label="Thumbnail Image"
            fileType="image"
            placeholder="Upload thumbnail image or paste URL"
            maxSizeMB={5}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <TextField
          label="Author"
          value={formData.author || ''}
          onChange={(value) => setFormData({...formData, author: value})}
          placeholder="Video author"
          required
        />
        <div>
          <label className="block text-sm font-medium text-white mb-2">Featured</label>
          <div className="flex items-center mt-3">
            <input
              type="checkbox"
              id="featured"
              checked={!!formData.featured}
              onChange={(e) => setFormData({...formData, featured: e.target.checked})}
              className="h-4 w-4"
            />
            <label htmlFor="featured" className="ml-2 text-sm text-white">Set as featured video</label>
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-4 mt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="bg-white/10 hover:bg-white/20 text-white border-white/20"
        >
          Cancel
        </Button>
        <Button type="submit" className="bg-blue-600/20 hover:bg-blue-600/40 backdrop-blur text-blue-200 border border-blue-600/30">Save Video</Button>
      </div>
    </form>
  );
}

function ProductForm({ product, onSubmit, onCancel }: {
  product?: Product;
  onSubmit: (data: Partial<Product>) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState<Partial<Product>>(
    product || {
      name: '',
      price: 0,
      category: 'Apparel' as 'Apparel' | 'Accessories',
      organization: '',
      sizeStock: [],
      stock: 0,
      image: '',
      images: [],
      description: ''
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const addSizeStock = () => {
    setFormData({
      ...formData,
      sizeStock: [...(formData.sizeStock || []), { size: '', stock: 0 }]
    });
  };

  const removeSizeStock = (index: number) => {
    const newSizeStock = [...(formData.sizeStock || [])];
    newSizeStock.splice(index, 1);
    setFormData({ ...formData, sizeStock: newSizeStock });
  };

  const updateSizeStock = (index: number, field: 'size' | 'stock', value: string | number) => {
    const newSizeStock = [...(formData.sizeStock || [])];
    newSizeStock[index] = { ...newSizeStock[index], [field]: value };
    setFormData({ ...formData, sizeStock: newSizeStock });
  };

  const addImage = () => {
    setFormData({
      ...formData,
      images: [...(formData.images || []), '']
    });
  };

  const removeImage = (index: number) => {
    const newImages = [...(formData.images || [])];
    newImages.splice(index, 1);
    setFormData({ ...formData, images: newImages });
  };

  const updateImage = (index: number, value: string) => {
    const newImages = [...(formData.images || [])];
    newImages[index] = value;
    setFormData({ ...formData, images: newImages });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
        <TextField
          label="Product Name"
          value={formData.name || ''}
          onChange={(value) => setFormData({...formData, name: value})}
          placeholder="Enter product name"
          required
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <TextField
            label="Price ($)"
            type="number"
            value={formData.price ? String(formData.price) : ''}
            onChange={(value) => setFormData({...formData, price: parseFloat(value) || 0})}
            placeholder="0.00"
            step="0.01"
            required
          />
          <div>
            <label className="block text-sm font-medium text-white mb-2">Category</label>
            <Select
              value={formData.category || 'Apparel'}
              onValueChange={(value: 'Apparel' | 'Accessories') => setFormData({...formData, category: value})}
            >
              <SelectTrigger className="bg-white/[0.02] backdrop-blur-3xl border border-white/10 text-white">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Apparel">Apparel</SelectItem>
                <SelectItem value="Accessories">Accessories</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <TextField
          label="Organization"
          value={formData.organization || ''}
          onChange={(value) => setFormData({...formData, organization: value})}
          placeholder="ASB, Drama Club, etc."
          required
        />

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-white">Size & Stock</label>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={addSizeStock}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20"
            >
              <PlusCircle className="w-4 h-4 mr-1" />
              Add Size
            </Button>
          </div>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {(formData.sizeStock || []).map((sizeStock, index) => (
              <div key={index} className="flex gap-2 items-center">
                <Input
                  placeholder="Size (e.g., S, M, L, One Size)"
                  value={sizeStock.size}
                  onChange={(e) => updateSizeStock(index, 'size', e.target.value)}
                  className="flex-1 bg-white/[0.02] backdrop-blur-3xl border border-white/10 text-white placeholder-gray-400"
                />
                <Input
                  type="number"
                  placeholder="Stock"
                  value={sizeStock.stock}
                  onChange={(e) => updateSizeStock(index, 'stock', parseInt(e.target.value) || 0)}
                  className="w-24 bg-white/[0.02] backdrop-blur-3xl border border-white/10 text-white placeholder-gray-400"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  onClick={() => removeSizeStock(index)}
                  className="p-2 bg-red-600/20 hover:bg-red-600/40 text-red-200 border-red-600/30"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
            {(formData.sizeStock || []).length === 0 && (
              <p className="text-sm text-gray-400 italic">No sizes added yet. Click "Add Size" to get started.</p>
            )}
          </div>
        </div>

        <TextAreaField
          label="Description"
          value={formData.description || ''}
          onChange={(value) => setFormData({...formData, description: value})}
          placeholder="Product description"
          rows={3}
        />

        <div>
          <FileUpload
            value={formData.image || ''}
            onChange={(url) => setFormData({...formData, image: url})}
            label="Main Product Image"
            fileType="image"
            placeholder="Upload product image or paste URL"
            maxSizeMB={5}
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-white">Additional Images</label>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={addImage}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20"
            >
              <PlusCircle className="w-4 h-4 mr-1" />
              Add Image
            </Button>
          </div>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {(formData.images || []).map((image, index) => (
              <div key={index} className="flex gap-2 items-start">
                <div className="flex-1">
                  <FileUpload
                    value={image}
                    onChange={(url) => updateImage(index, url)}
                    label={`Additional Image ${index + 1}`}
                    fileType="image"
                    placeholder="Upload image or paste URL"
                    maxSizeMB={5}
                  />
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  onClick={() => removeImage(index)}
                  className="mt-6 p-2 bg-red-600/20 hover:bg-red-600/40 text-red-200 border-red-600/30"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
            {(formData.images || []).length === 0 && (
              <p className="text-sm text-gray-400 italic">No additional images added yet. Click "Add Image" to get started.</p>
            )}
          </div>
        </div>

        <div className="flex gap-2 pt-4">
          <Button
            type="submit"
            className="bg-blue-600/20 hover:bg-blue-600/40 backdrop-blur text-blue-200 border border-blue-600/30"
          >
            {product ? 'Update Product' : 'Add Product'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="bg-white/10 hover:bg-white/20 backdrop-blur text-white border-white/20"
          >
            Cancel
          </Button>
        </div>
      </form>
  );
}

function EventForm({ event, onSubmit, onCancel }: {
  event?: Event;
  onSubmit: (data: Partial<Event>) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState<Partial<Event>>(() => {
    if (event) {
      return {
        ...event,
        ticketTypes: Array.isArray(event.ticketTypes) ? event.ticketTypes : [],
        requiredForms: {
          studentIdRequired: event.requiredForms?.studentIdRequired || false,
          customForms: Array.isArray(event.requiredForms?.customForms) ? event.requiredForms.customForms : []
        }
      };
    }
    return {
      title: '',
      category: '',
      date: new Date(),
      time: '',
      location: '',
      description: '',
      ticketTypes: [],
      requiresApproval: false,
      requiredForms: {
        studentIdRequired: false,
        customForms: []
      }
    };
  });

  const [newCustomForm, setNewCustomForm] = useState({ name: '', pdfUrl: '', required: true });
  const [newTicketType, setNewTicketType] = useState({ name: '', description: '', price: '', maxTickets: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value) {
      const newDate = new Date(value);
      if (!isNaN(newDate.getTime())) {
        setFormData({...formData, date: newDate});
      }
    } else {
      setFormData({...formData, date: undefined});
    }
  };

  const formatDateForInput = (date: Date | undefined) => {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    return d.toISOString().split('T')[0];
  };

  const addCustomForm = () => {
    if (newCustomForm.name.trim() && newCustomForm.pdfUrl.trim() && formData.requiredForms) {
      setFormData({
        ...formData,
        requiredForms: {
          ...formData.requiredForms,
          customForms: [...(formData.requiredForms.customForms || []), {
            name: newCustomForm.name.trim(),
            pdfUrl: newCustomForm.pdfUrl.trim(),
            required: newCustomForm.required
          }]
        }
      });
      setNewCustomForm({ name: '', pdfUrl: '', required: true });
    }
  };

  const removeCustomForm = (index: number) => {
    if (formData.requiredForms) {
      setFormData({
        ...formData,
        requiredForms: {
          ...formData.requiredForms,
          customForms: formData.requiredForms.customForms?.filter((_, i) => i !== index) || []
        }
      });
    }
  };
  const updateStudentIdRequired = (value: boolean) => {
    setFormData({
      ...formData,
      requiredForms: {
        studentIdRequired: value,
        customForms: formData.requiredForms?.customForms || []
      }
    });
  };

  const addTicketType = () => {
    const price = parseFloat(newTicketType.price);
    const maxTickets = parseInt(newTicketType.maxTickets, 10);

    if (newTicketType.name.trim() && newTicketType.description.trim() && price > 0 && maxTickets > 0) {
      setFormData({
        ...formData,
        ticketTypes: [...(formData.ticketTypes || []), {
          name: newTicketType.name.trim(),
          description: newTicketType.description.trim(),
          price: price,
          maxTickets: maxTickets
        }]
      });
      setNewTicketType({ name: '', description: '', price: '', maxTickets: '' });
    }
  };

  const removeTicketType = (index: number) => {
    setFormData({
      ...formData,
      ticketTypes: formData.ticketTypes?.filter((_, i) => i !== index) || []
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-white mb-2">Event Title</label>
        <Input
          value={formData.title || ''}
          onChange={(e) => setFormData({...formData, title: e.target.value})}
          placeholder="Enter event title"
          required
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-white mb-2">Category</label>
          <Input
            value={formData.category || ''}
            onChange={(e) => setFormData({...formData, category: e.target.value})}
            placeholder="e.g., Dance, Sports, Academic"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-white mb-2">Date</label>
          <Input
            type="date"
            value={formatDateForInput(formData.date)}
            onChange={handleDateChange}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-white mb-2">Time</label>
          <Input
            value={formData.time || ''}
            onChange={(e) => setFormData({...formData, time: e.target.value})}
            placeholder="7:00 PM - 11:00 PM"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-white mb-2">Location</label>
          <Input
            value={formData.location || ''}
            onChange={(e) => setFormData({...formData, location: e.target.value})}
            placeholder="School Gymnasium"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-white mb-2">Description</label>
        <Textarea
          value={formData.description || ''}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
          placeholder="Event description"
          rows={3}
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-white">Ticket Types</label>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={addTicketType}
            className="bg-white/10 hover:bg-white/20 text-white border-white/20"
          >
            <PlusCircle className="w-4 h-4 mr-1" />
            Add Ticket Type
          </Button>
        </div>

        <div className="mb-4 p-4 rounded-lg border border-white/20 bg-white/5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <Input
              placeholder="Ticket Type Name (e.g., General Admission)"
              value={newTicketType.name}
              onChange={(e) => setNewTicketType({...newTicketType, name: e.target.value})}
            />
            <Input
              type="number"
              placeholder="Price"
              value={newTicketType.price}
              onChange={(e) => setNewTicketType({...newTicketType, price: e.target.value})}
              step="0.01"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              placeholder="Description (e.g., Includes dinner and dancing)"
              value={newTicketType.description}
              onChange={(e) => setNewTicketType({...newTicketType, description: e.target.value})}
            />
            <Input
              type="number"
              placeholder="Max Tickets Available"
              value={newTicketType.maxTickets}
              onChange={(e) => setNewTicketType({...newTicketType, maxTickets: e.target.value})}
              min="1"
              step="1"
            />
          </div>
        </div>

        <div className="space-y-2 max-h-40 overflow-y-auto">
          {(formData.ticketTypes || []).map((ticketType, index) => (
            <div key={index} className="flex gap-2 items-center p-3 bg-white/5 rounded-lg border border-white/10">
              <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-4 gap-2 text-sm">
                <div>
                  <p className="font-medium text-white break-words">{ticketType.name}</p>
                </div>
                <div>
                  <p className="text-gray-300 break-words">{ticketType.description}</p>
                </div>
                <div>
                  <p className="text-green-400">${ticketType.price.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-gray-300">Max: {ticketType.maxTickets}</p>
                </div>
              </div>
              <Button
                type="button"
                size="sm"
                variant="destructive"
                onClick={() => removeTicketType(index)}
                className="p-2 bg-red-600/20 hover:bg-red-600/40 text-red-200 border-red-600/30"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
          {(!formData.ticketTypes || !Array.isArray(formData.ticketTypes) || formData.ticketTypes.length === 0) && (
            <p className="text-sm text-gray-400 italic">No ticket types added yet. Add ticket types above for multiple pricing options.</p>
          )}
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="requiresApproval"
          checked={formData.requiresApproval || false}
          onChange={(e) => setFormData({...formData, requiresApproval: e.target.checked})}
          className="rounded"
        />
        <label htmlFor="requiresApproval" className="text-sm text-white">
          Requires approval
        </label>
      </div>

      {formData.requiresApproval && (
        <div className="border border-white/20 rounded-lg p-4 bg-white/5 space-y-4">
          <h3 className="text-lg font-semibold text-white">Form Requirements</h3>

          <div className="flex items-center space-x-2 mb-4">
            <input
              type="checkbox"
              id="studentIdRequired"
              checked={formData.requiredForms?.studentIdRequired || false}
              onChange={(e) => updateStudentIdRequired(e.target.checked)}
              className="rounded border-gray-600 bg-gray-700"
            />
            <label htmlFor="studentIdRequired" className="text-sm font-medium text-gray-300">
              Student ID Required
            </label>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-white mb-2">Required Forms</label>

            <div className="space-y-4 mb-4">
              <Input
                value={newCustomForm.name}
                onChange={(e) => setNewCustomForm({...newCustomForm, name: e.target.value})}
                placeholder="Form name (e.g., Permission Slip, Medical Form)"
                className="w-full"
              />
              <FileUpload
                value={newCustomForm.pdfUrl}
                onChange={(url) => setNewCustomForm({...newCustomForm, pdfUrl: url})}
                label="Form PDF"
                fileType="pdf"
                placeholder="Upload a PDF form or paste URL"
                maxSizeMB={5}
              />
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="newFormRequired"
                  checked={newCustomForm.required}
                  onChange={(e) => setNewCustomForm({...newCustomForm, required: e.target.checked})}
                  className="rounded border-gray-600 bg-gray-700"
                />
                <label htmlFor="newFormRequired" className="text-sm font-medium text-gray-300">
                  Required Form
                </label>
              </div>
              <Button
                type="button"
                onClick={addCustomForm}
                variant="outline"
                size="sm"
                className="border-white/20 text-gray-300 hover:bg-white/10"
                disabled={!newCustomForm.name.trim() || !newCustomForm.pdfUrl.trim()}
              >
                <PlusCircle className="h-4 w-4 mr-1" />
                Add Form
              </Button>
            </div>

            {formData.requiredForms?.customForms && Array.isArray(formData.requiredForms.customForms) && formData.requiredForms.customForms.length > 0 && (
              <div className="space-y-2">
                {formData.requiredForms.customForms.map((form, index) => (
                  <div key={index} className="flex items-center justify-between bg-white/10 rounded-lg p-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-white">{form.name}</p>
                        <span className={`text-xs px-2 py-1 rounded ${
                          form.required !== false
                            ? 'bg-red-500/20 text-red-200 border border-red-500/30'
                            : 'bg-gray-500/20 text-gray-300 border border-gray-500/30'
                        }`}>
                          {form.required !== false ? 'Required' : 'Optional'}
                        </span>
                      </div>
                      <a
                        href={form.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-400 hover:text-blue-300 break-all"
                      >
                        {form.pdfUrl}
                      </a>
                    </div>
                    <Button
                      type="button"
                      onClick={() => removeCustomForm(index)}
                      variant="destructive"
                      size="sm"
                      className={`${ICON_BUTTON_CLASS} ml-2`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex gap-2 pt-4">
        <PrimaryButton type="submit">
          {event ? 'Update Event' : 'Add Event'}
        </PrimaryButton>
        <OutlineButton type="button" onClick={onCancel}>
          Cancel
        </OutlineButton>
      </div>
    </form>
  );
}

function AnnouncementForm({ announcement, onSubmit, onCancel }: {
  announcement?: Announcement;
  onSubmit: (data: Partial<Announcement>) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState<Partial<Announcement>>(
    announcement || {
      title: '',
      content: '',
      priority: 'medium'
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <TextField
        label="Announcement Title"
        value={formData.title || ''}
        onChange={(value) => setFormData({...formData, title: value})}
        placeholder="Enter announcement title"
        required
      />

      <TextAreaField
        label="Content"
        value={formData.content || ''}
        onChange={(value) => setFormData({...formData, content: value})}
        placeholder="Announcement content"
        rows={4}
        required
      />

      <div>
        <label className="block text-sm font-medium text-white mb-2">Priority</label>
        <Select value={formData.priority || 'medium'} onValueChange={(value: 'high' | 'medium' | 'low') => setFormData({...formData, priority: value})}>
          <SelectTrigger className="bg-white/[0.02] backdrop-blur-3xl border border-white/10 text-white">
            <SelectValue placeholder="Select priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-2 pt-4">
        <Button type="submit" className="bg-blue-600/20 hover:bg-blue-600/40 backdrop-blur text-blue-200 border border-blue-600/30">
          {announcement ? 'Update Announcement' : 'Add Announcement'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} className="bg-white/5 hover:bg-white/10 text-white border-white/20">
          Cancel
        </Button>
      </div>
    </form>
  );
}

function StudentGovForm({ member, onSubmit, onCancel }: {
  member?: StudentGovPosition;
  onSubmit: (data: Partial<StudentGovPosition>) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState<Partial<StudentGovPosition>>(
    member || {
      position: '',
      gradeLevel: '',
      bio: '',
      description: '',
      currentRepresentatives: []
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const addRepresentative = () => {
    setFormData({
      ...formData,
      currentRepresentatives: [
        ...(formData.currentRepresentatives || []),
        { name: '', email: '', bio: '', image: '' }
      ]
    });
  };

  const removeRepresentative = (index: number) => {
    setFormData({
      ...formData,
      currentRepresentatives: formData.currentRepresentatives?.filter((_, i) => i !== index) || []
    });
  };

  const updateRepresentative = (index: number, field: 'name' | 'email' | 'bio' | 'image', value: string) => {
    const updated = [...(formData.currentRepresentatives || [])];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, currentRepresentatives: updated });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <TextField
        label="Position Title"
        value={formData.position || ''}
        onChange={(value) => setFormData({...formData, position: value})}
        placeholder="ASB President, Secretary, etc."
        required
      />
      <div>
        <label className="block text-sm font-medium text-white mb-2">Grade Level</label>
        <Select value={formData.gradeLevel || ''} onValueChange={(value: string) => setFormData({...formData, gradeLevel: value})}>
          <SelectTrigger className="bg-white/[0.02] backdrop-blur-3xl border border-white/10 text-white">
            <SelectValue placeholder="Select grade level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="officer">Officer</SelectItem>
            <SelectItem value="senior">Senior</SelectItem>
            <SelectItem value="junior">Junior</SelectItem>
            <SelectItem value="sophomore">Sophomore</SelectItem>
            <SelectItem value="freshman">Freshman</SelectItem>
            <SelectItem value="committee">Committee</SelectItem>
            <SelectItem value="birds eye">Birds Eye</SelectItem>
            <SelectItem value="tech">Tech</SelectItem>
            <SelectItem value="culture and diversity">Culture and Diversity</SelectItem>
            <SelectItem value="spirit">Spirit</SelectItem>
            <SelectItem value="publicity">Publicity</SelectItem>
            <SelectItem value="clubs">Clubs</SelectItem>
            <SelectItem value="athletics">Athletics</SelectItem>
            <SelectItem value="student/staff">Student/Staff</SelectItem>
            <SelectItem value="special projects">Special Projects</SelectItem>
            <SelectItem value="performance">Performance</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <TextAreaField
        label="Bio"
        value={formData.bio || ''}
        onChange={(value) => setFormData({...formData, bio: value})}
        placeholder="Brief bio for this position"
        rows={2}
        required
      />

      <TextAreaField
        label="Description"
        value={formData.description || ''}
        onChange={(value) => setFormData({...formData, description: value})}
        placeholder="Position description and responsibilities"
        rows={3}
        required
      />

      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="block text-sm font-medium text-white">Current Representatives</label>
          <Button type="button" onClick={addRepresentative} variant="outline" size="sm" className="bg-white/5 hover:bg-white/10 text-white border-white/20">
            <PlusCircle className="h-4 w-4 mr-1" />
            Add Representative
          </Button>
        </div>

        {formData.currentRepresentatives && formData.currentRepresentatives.length > 0 ? (
          <div className="space-y-3">
            {formData.currentRepresentatives.map((rep, index) => (
              <div key={index} className="border border-white/20 rounded-lg p-3 bg-white/5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">Name</label>
                    <Input
                      value={rep.name}
                      onChange={(e) => updateRepresentative(index, 'name', e.target.value)}
                      placeholder="Representative name"
                      className="bg-white/[0.02] backdrop-blur-3xl border border-white/10 text-white placeholder-gray-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">Email</label>
                    <Input
                      type="email"
                      value={rep.email || ''}
                      onChange={(e) => updateRepresentative(index, 'email', e.target.value)}
                      placeholder="dr@doofenshmirtz.com"
                      className="bg-white/[0.02] backdrop-blur-3xl border border-white/10 text-white placeholder-gray-400"
                    />
                  </div>
                </div>
                <div className="mb-2">
                  <label className="block text-xs font-medium text-gray-300 mb-1">Bio</label>
                  <Textarea
                    value={rep.bio || ''}
                    onChange={(e) => updateRepresentative(index, 'bio', e.target.value)}
                    placeholder="Representative bio"
                    rows={2}
                    className="bg-white/[0.02] backdrop-blur-3xl border border-white/10 text-white placeholder-gray-400"
                  />
                </div>
                <div className="mb-2">
                  <FileUpload
                    value={rep.image || ''}
                    onChange={(url) => updateRepresentative(index, 'image', url)}
                    label="Representative Image"
                    fileType="image"
                    placeholder="Upload image or paste URL"
                    maxSizeMB={5}
                  />
                </div>
                <Button
                  type="button"
                  onClick={() => removeRepresentative(index)}
                  variant="destructive"
                  size="sm"
                  className="h-6 px-2 text-xs"
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Remove
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400 italic">No representatives added yet.</p>
        )}
      </div>

      <div className="flex gap-2 pt-4">
        <Button type="submit" className="bg-blue-600/20 hover:bg-blue-600/40 backdrop-blur text-blue-200 border border-blue-600/30">
          {member ? 'Update Position' : 'Add Position'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} className="bg-white/5 hover:bg-white/10 text-white border-white/20">
          Cancel
        </Button>
      </div>
    </form>
  );
}

function ClubForm({ club, onSubmit, onCancel }: {
  club?: Club;
  onSubmit: (data: Partial<Club>) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState<Partial<Club>>(
    club || {
      name: '',
      description: '',
      contactEmail: '',
      image: '',
      memberCount: 0,
      requirements: [],
      activities: [],
      isActive: true
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <TextField
        label="Club Name"
        value={formData.name || ''}
        onChange={(value) => setFormData({...formData, name: value})}
        placeholder="Drama Club"
        required
      />

      <TextAreaField
        label="Description"
        value={formData.description || ''}
        onChange={(value) => setFormData({...formData, description: value})}
        placeholder="Club description"
        rows={3}
      />

      <TextField
        label="Contact Email"
        type="email"
        value={formData.contactEmail || ''}
        onChange={(value) => setFormData({...formData, contactEmail: value})}
        placeholder="master@oogway.com"
        required
      />

      <div>
        <FileUpload
          value={formData.image || ''}
          onChange={(url) => setFormData({...formData, image: url})}
          label="Club Image"
          fileType="image"
          placeholder="Upload club image or paste URL"
          maxSizeMB={5}
        />
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="clubActive"
          checked={formData.isActive || false}
          onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
          className="rounded border-gray-600 bg-gray-700"
        />
        <label htmlFor="clubActive" className="text-sm font-medium text-white">
          Active Club
        </label>
      </div>

      <div className="flex gap-2 pt-4">
        <Button type="submit" className="bg-blue-600/20 hover:bg-blue-600/40 backdrop-blur text-blue-200 border border-blue-600/30">
          {club ? 'Update Club' : 'Add Club'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} className="bg-white/5 hover:bg-white/10 text-white border-white/20">
          Cancel
        </Button>
      </div>
    </form>
  );
}

export default function AdminMongoDB() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const [products, setProducts] = useState<Product[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [videos, setVideos] = useState<VideoPost[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [studentGov, setStudentGov] = useState<StudentGovPosition[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [formSubmissions, setFormSubmissions] = useState<FormSubmission[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [showStudentGovModal, setShowStudentGovModal] = useState(false);
  const [showClubModal, setShowClubModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  const [submissionEventFilter, setSubmissionEventFilter] = useState<string>('all');
  const [submissionSearch, setSubmissionSearch] = useState<string>('');
  const [submissionStatusFilter, setSubmissionStatusFilter] = useState<'all' | 'pending' | 'approved_paid' | 'approved_unpaid' | 'rejected'>('all');
  const [submissionSortOrder, setSubmissionSortOrder] = useState<'newest' | 'oldest'>('newest');

  const [submissionDisplayCount, setSubmissionDisplayCount] = useState(10);

  const [rejectionSubmissionId, setRejectionSubmissionId] = useState<string>('');
  const [rejectionReason, setRejectionReason] = useState<string>('');

  const [showSubmissionDetailModal, setShowSubmissionDetailModal] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<FormSubmission | null>(null);

  const [, setLocation] = useLocation();

  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('admin-active-tab') || 'products';
  });

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    localStorage.setItem('admin-active-tab', value);
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/admin/check-auth', {
          credentials: 'include'
        });
        const data = await response.json();
        setIsAuthenticated(data.authenticated);
      } catch (err) {
        console.error('Auth check failed:', err);
        setIsAuthenticated(false);
      } finally {
        setCheckingAuth(false);
      }
    };
    checkAuth();
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    const fetchAllData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [
          productsData,
          eventsData,
          videosData,
          announcementsData,
          studentGovData,
          clubsData,
          formSubmissionsData,
          purchasesData
        ] = await Promise.all([
          getProducts(),
          getEvents(),
          getVideos(),
          getAnnouncements(),
          getStudentGovPositions(),
          getClubs(),
          getFormSubmissions(),
          getPurchases()
        ]);

        setProducts(productsData);
        setEvents(eventsData);
        setVideos(videosData);
        setAnnouncements(announcementsData);
        setStudentGov(studentGovData);
        setClubs(clubsData);
        setFormSubmissions(formSubmissionsData);
        setPurchases(purchasesData);
      } catch (err) {
        console.error('Failed to fetch data:', err);
        setError('Failed to load data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [isAuthenticated]);

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/logout', {
        method: 'POST',
        credentials: 'include'
      });
      setIsAuthenticated(false);
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const handleViewSubmissionDetails = (submission: FormSubmission) => {
    setSelectedSubmission(submission);
    setShowSubmissionDetailModal(true);
  };

  const handleAddProduct = async (productData: Partial<Product>) => {
    try {
      const newProduct = await createProduct(productData);
      setProducts([...products, newProduct]);
      setShowProductModal(false);
      setEditingItem(null);
    } catch (err) {
      console.error('Failed to add product:', err);
      alert('Failed to add product. Please try again.');
    }
  };

  const handleUpdateProduct = async (productData: Partial<Product>) => {
    if (!editingItem?._id) return;

    try {
      const updatedProduct = await updateProduct(editingItem._id, productData);
      setProducts(products.map(p => p._id === editingItem._id ? updatedProduct : p));
      setShowProductModal(false);
      setEditingItem(null);
    } catch (err) {
      console.error('Failed to update product:', err);
      alert('Failed to update product. Please try again.');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await deleteProduct(id);
        setProducts(products.filter(p => p._id !== id));
      } catch (err) {
        console.error('Failed to delete product:', err);
        alert('Failed to delete product. Please try again.');
      }
    }
  };

  const handleAddEvent = async (eventData: Partial<Event>) => {
    try {
      const newEvent = await createEvent(eventData);
      setEvents([...events, newEvent]);
      setShowEventModal(false);
      setEditingItem(null);
    } catch (err) {
      console.error('Failed to add event:', err);
      alert('Failed to add event. Please try again.');
    }
  };

  const handleUpdateEvent = async (eventData: Partial<Event>) => {
    if (!editingItem?._id) return;

    try {
      const updatedEvent = await updateEvent(editingItem._id, eventData);
      setEvents(events.map(e => e._id === editingItem._id ? updatedEvent : e));
      setShowEventModal(false);
      setEditingItem(null);
    } catch (err) {
      console.error('Failed to update event:', err);
      alert('Failed to update event. Please try again.');
    }
  };

  const handleDeleteEvent = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      try {
        await deleteEvent(id);
        setEvents(events.filter(e => e._id !== id));
      } catch (err) {
        console.error('Failed to delete event:', err);
        alert('Failed to delete event. Please try again.');
      }
    }
  };

  const handleAddVideo = async (videoData: Partial<VideoPost>) => {
    try {
      const newVideo = await createVideo(videoData);
      setVideos([...videos, newVideo]);
      setShowVideoModal(false);
      setEditingItem(null);
    } catch (err) {
      console.error('Failed to add video:', err);
      alert('Failed to add video. Please try again.');
    }
  };

  const handleUpdateVideo = async (videoData: Partial<VideoPost>) => {
    if (!editingItem?._id) return;

    try {
      const updatedVideo = await updateVideo(editingItem._id, videoData);
      setVideos(videos.map(v => v._id === editingItem._id ? updatedVideo : v));
      setShowVideoModal(false);
      setEditingItem(null);
    } catch (err) {
      console.error('Failed to update video:', err);
      alert('Failed to update video. Please try again.');
    }
  };
  const handleDeleteVideo = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this video?')) {
      try {
        await deleteVideo(id);
        setVideos(videos.filter(v => v._id !== id));
      } catch (err) {
        console.error('Failed to delete video:', err);
        alert('Failed to delete video. Please try again.');
      }
    }  };

  const handleAddAnnouncement = async (announcementData: Partial<Announcement>) => {
    try {
      const newAnnouncement = await createAnnouncement({
        ...announcementData,
        author: 'Admin',
        date: new Date()
      });
      setAnnouncements([...announcements, newAnnouncement]);
      setShowAnnouncementModal(false);
      setEditingItem(null);
    } catch (err) {
      console.error('Failed to add announcement:', err);
      alert('Failed to add announcement. Please try again.');
    }
  };

  const handleUpdateAnnouncement = async (announcementData: Partial<Announcement>) => {
    if (!editingItem?._id) return;

    try {
      const updatedAnnouncement = await updateAnnouncement(editingItem._id, announcementData);
      setAnnouncements(announcements.map(a => a._id === editingItem._id ? updatedAnnouncement : a));
      setShowAnnouncementModal(false);
      setEditingItem(null);
    } catch (err) {
      console.error('Failed to update announcement:', err);
      alert('Failed to update announcement. Please try again.');
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this announcement?')) {
      try {
        await deleteAnnouncement(id);
        setAnnouncements(announcements.filter(a => a._id !== id));
      } catch (err) {
        console.error('Failed to delete announcement:', err);
        alert('Failed to delete announcement. Please try again.');
      }
    }
  };
  const handleAnnouncementSubmit = async (announcementData: Partial<Announcement>) => {
    if (editingItem) {
      await handleUpdateAnnouncement(announcementData);
    } else {
      await handleAddAnnouncement(announcementData);
    }
  };

  const handleAddStudentGov = async (memberData: Partial<StudentGovPosition>) => {
    try {
      const newPosition = await createStudentGovPosition(memberData);
      setStudentGov([...studentGov, newPosition]);
      setShowStudentGovModal(false);
      setEditingItem(null);
    } catch (err) {
      console.error('Failed to add student government position:', err);
      alert('Failed to add student government position. Please try again.');
    }
  };

  const handleUpdateStudentGov = async (memberData: Partial<StudentGovPosition>) => {
    if (!editingItem?._id) return;

    try {
      const updatedPosition = await updateStudentGovPosition(editingItem._id, memberData);
      setStudentGov(studentGov.map(s => s._id === editingItem._id ? updatedPosition : s));
      setShowStudentGovModal(false);
      setEditingItem(null);
    } catch (err) {
      console.error('Failed to update student government position:', err);
      alert('Failed to update student government position. Please try again.');
    }
  };

  const handleDeleteStudentGov = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this student government position?')) {
      try {
        await deleteStudentGovPosition(id);
        setStudentGov(studentGov.filter(s => s._id !== id));
      } catch (err) {
        console.error('Failed to delete student government position:', err);
        alert('Failed to delete student government position. Please try again.');
      }
    }
  };

  const handleStudentGovSubmit = async (memberData: Partial<StudentGovPosition>) => {
    if (editingItem) {
      await handleUpdateStudentGov(memberData);
    } else {
      await handleAddStudentGov(memberData);
    }
  };

  const handleAddClub = async (clubData: Partial<Club>) => {
    try {
      const newClub = await createClub(clubData);
      setClubs([...clubs, newClub]);
      setShowClubModal(false);
      setEditingItem(null);
    } catch (err) {
      console.error('Failed to add club:', err);
      alert('Failed to add club. Please try again.');
    }
  };

  const handleUpdateClub = async (clubData: Partial<Club>) => {
    if (!editingItem?._id) return;

    try {
      const updatedClub = await updateClub(editingItem._id, clubData);
      setClubs(clubs.map(c => c._id === editingItem._id ? updatedClub : c));
      setShowClubModal(false);
      setEditingItem(null);
    } catch (err) {
      console.error('Failed to update club:', err);
      alert('Failed to update club. Please try again.');
    }
  };

  const handleDeleteClub = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this club?')) {
      try {
        await deleteClub(id);
        setClubs(clubs.filter(c => c._id !== id));
      } catch (err) {
        console.error('Failed to delete club:', err);
        alert('Failed to delete club. Please try again.');
      }
    }
  };

  const handleClubSubmit = async (clubData: Partial<Club>) => {
    if (editingItem) {
      await handleUpdateClub(clubData);
    } else {
      await handleAddClub(clubData);
    }
  };

  const filteredFormSubmissions = formSubmissions
    .filter(submission => {
      const eventIdStr = resolveEventId(submission.eventId);
      const eventMatch = submissionEventFilter === 'all' || eventIdStr === submissionEventFilter;

      let statusMatch = false;
      if (submissionStatusFilter === 'all') {
        statusMatch = true;
      } else if (submissionStatusFilter === 'pending') {
        statusMatch = submission.status === 'pending';
      } else if (submissionStatusFilter === 'rejected') {
        statusMatch = submission.status === 'rejected';
      } else if (submissionStatusFilter === 'approved_paid') {
        statusMatch = submission.status === 'paid';
      } else if (submissionStatusFilter === 'approved_unpaid') {
        statusMatch = submission.status === 'approved';
      }

      const searchMatch = submissionSearch === '' ||
        submission.studentName.toLowerCase().includes(submissionSearch.toLowerCase());

      return eventMatch && statusMatch && searchMatch;
    })
    .sort((a, b) => {
      const dateA = new Date(a.submissionDate).getTime();
      const dateB = new Date(b.submissionDate).getTime();
      return submissionSortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });

  const sendEmailNotification = async (to: string, subject: string, message: string) => {
    await new Promise(resolve => setTimeout(resolve, 500));

    return { success: true };
  };

  const handleApproveSubmission = async (id: string) => {
    try {
      const submission = formSubmissions.find(s => s._id === id);
      if (!submission) {
        throw new Error('Submission not found');
      }

      const event = events.find(e => e._id === resolveEventId(submission.eventId));

      await updateFormSubmission(id, {
        status: 'approved',
        reviewedAt: new Date(),
        reviewedBy: 'Admin'
      });

      setFormSubmissions(formSubmissions.map(s =>
        s._id === id ? { ...s, status: 'approved', reviewedAt: new Date(), reviewedBy: 'Admin' } : s
      ));

      if (event) {
        const ticketPrice = submission.ticketType?.price ?? getLowestTicketPrice(event);
        const totalAmount = typeof submission.totalAmount === 'number'
          ? submission.totalAmount
          : submission.quantity * ticketPrice;
        const emailSubject = `Your Request for ${event.title} has been Approved`;
        const emailMessage = `
Dear ${submission.studentName},

Great news! Your request to attend ${event.title} has been approved.

Event Details:
- Date: ${new Date(event.date).toLocaleDateString()}
- Time: ${event.time}
- Location: ${event.location}

You can now proceed to make your payment for ${submission.quantity} ticket(s) at $${ticketPrice.toFixed(2)} each.
Total Amount: $${totalAmount.toFixed(2)}

Please proceed to the payment section on our website to complete your purchase.

Thank you,
ESHS ASB Team
        `;

        await sendEmailNotification(submission.email, emailSubject, emailMessage);
      }
    } catch (err) {
      console.error('Failed to approve submission:', err);
      alert('Failed to approve submission. Please try again.');
    }
  };

  const handleRejectWithReason = (submissionId: string) => {
    setRejectionSubmissionId(submissionId);
    setRejectionReason('');
    setShowRejectionModal(true);
  };

  const confirmRejection = async () => {
    if (!rejectionReason.trim()) return;

    try {
      const submission = formSubmissions.find(s => s._id === rejectionSubmissionId);
      if (!submission) {
        throw new Error('Submission not found');
      }

      await updateFormSubmission(rejectionSubmissionId, {
        status: 'rejected',
        reviewedAt: new Date(),
        reviewedBy: 'Admin',
        rejectionReason: rejectionReason
      });

      setFormSubmissions(formSubmissions.map(s =>
        s._id === rejectionSubmissionId ? {
          ...s,
          status: 'rejected',
          reviewedAt: new Date(),
          reviewedBy: 'Admin',
          rejectionReason: rejectionReason
        } : s
      ));

      setShowRejectionModal(false);
      setRejectionSubmissionId('');
      setRejectionReason('');
    } catch (err) {
      console.error('Failed to reject submission:', err);
      alert('Failed to reject submission. Please try again.');
    }
  };

  const handleEdit = (type: string, item: any) => {
    setEditingItem(item);
    switch (type) {
      case 'product':
        setShowProductModal(true);
        break;
      case 'event':
        setShowEventModal(true);
        break;
    }
  };

  const handleCancelEdit = () => {
    setEditingItem(null);
    setShowProductModal(false);
    setShowEventModal(false);
  };

  const handleBackClick = () => {
    sessionStorage.setItem("came-from-internal", "true");
    setLocation("/");
  };

  const handleProductSubmit = async (productData: Partial<Product>) => {
    try {
      if (editingItem) {
        await handleUpdateProduct(productData);
      } else {
        await handleAddProduct(productData);
      }
    } catch (err) {
      console.error('Failed to save product:', err);
      alert('Failed to save product. Please try again.');
    }
  };

  const handleEventSubmit = async (eventData: Partial<Event>) => {
    try {
      if (editingItem) {
        await handleUpdateEvent(eventData);
      } else {
        await handleAddEvent(eventData);
      }
    } catch (err) {
      console.error('Failed to save event:', err);
      alert('Failed to save event. Please try again.');
    }
  };

  const handleVideoSubmit = async (videoData: Partial<VideoPost>) => {
    try {
      if (editingItem) {
        await handleUpdateVideo(videoData);
      } else {
        await handleAddVideo(videoData);
      }
    } catch (err) {
      console.error('Failed to save video:', err);
      alert('Failed to save video. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen relative">
        <BackgroundVideo />
        <div className="relative z-10 min-h-screen flex items-center justify-center">
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-xl">Loading admin data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen relative">
        <BackgroundVideo />
        <div className="relative z-10 min-h-screen flex items-center justify-center">
          <div className="text-white text-center">
            <p className="text-xl text-red-400 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()} className="bg-white/10 hover:bg-white/20">
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-black">
        <div className="text-white">Checking authentication...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AdminAuth onAuthenticated={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="min-h-screen relative">
      <BackgroundVideo />

      <div className="relative z-10 min-h-screen">
        <main className="container mx-auto px-4 py-8">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
            <div className="flex items-center min-w-0">
              <Button
                variant="ghost"
                onClick={handleBackClick}
                className="text-white/90 hover:text-white p-2 mr-3 md:mr-4 min-h-11 bg-white/[0.02] backdrop-blur-3xl border border-white/10 shadow-2xl rounded-lg hover:bg-white/10 transition-all duration-300 flex items-center space-x-2"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                <span>Back</span>
              </Button>
              <h1 className="font-bold text-xl md:text-3xl text-white tracking-tight break-words min-w-0">
                Admin Dashboard
              </h1>
            </div>
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="text-white/90 hover:text-white p-2 min-h-11 bg-red-500/20 backdrop-blur-xl border border-red-500/30 shadow-2xl rounded-lg hover:bg-red-500/30 transition-all duration-300 flex items-center space-x-2"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-6 mb-4 md:mb-8">
            <div className="bg-white/[0.02] backdrop-blur-3xl border border-white/10 shadow-2xl rounded-xl p-3 md:p-6">
              <div className="flex flex-row items-center justify-between space-y-0 pb-1 md:pb-2">
                <h3 className="text-xs md:text-sm font-medium text-gray-300">Products</h3>
                <Package className="h-3 w-3 md:h-4 md:w-4 text-blue-400" />
              </div>
              <div className="text-xl md:text-2xl font-bold text-white">{products.length}</div>
            </div>

            <div className="bg-white/[0.02] backdrop-blur-3xl border border-white/10 shadow-2xl rounded-xl p-3 md:p-6">
              <div className="flex flex-row items-center justify-between space-y-0 pb-1 md:pb-2">
                <h3 className="text-xs md:text-sm font-medium text-gray-300">Events</h3>
                <Calendar className="h-3 w-3 md:h-4 md:w-4 text-green-400" />
              </div>
              <div className="text-xl md:text-2xl font-bold text-white">{events.length}</div>
            </div>

            <div className="bg-white/[0.02] backdrop-blur-3xl border border-white/10 shadow-2xl rounded-xl p-3 md:p-6">
              <div className="flex flex-row items-center justify-between space-y-0 pb-1 md:pb-2">
                <h3 className="text-xs md:text-sm font-medium text-gray-300">Activities</h3>
                <Users className="h-3 w-3 md:h-4 md:w-4 text-purple-400" />
              </div>
              <div className="text-xl md:text-2xl font-bold text-white">{clubs.length}</div>
            </div>

            <div className="bg-white/[0.02] backdrop-blur-3xl border border-white/10 shadow-2xl rounded-xl p-3 md:p-6">
              <div className="flex flex-row items-center justify-between space-y-0 pb-1 md:pb-2">
                <h3 className="text-xs md:text-sm font-medium text-gray-300">Submissions</h3>
                <FileText className="h-3 w-3 md:h-4 md:w-4 text-yellow-400" />
              </div>
              <div className="text-xl md:text-2xl font-bold text-white">{formSubmissions.length}</div>
            </div>
          </div>
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="flex h-auto w-full justify-start overflow-x-auto [&::-webkit-scrollbar]:hidden gap-1 md:grid md:grid-cols-6 bg-white/[0.02] backdrop-blur-3xl border border-white/10">
              <TabsTrigger value="products" className={TAB_TRIGGER_CLASS}>
                <Package className="h-4 w-4" />
                <span>Merch</span>
              </TabsTrigger>
              <TabsTrigger value="events" className={TAB_TRIGGER_CLASS}>
                <Calendar className="h-4 w-4" />
                <span>Activities</span>
              </TabsTrigger>
              <TabsTrigger value="orders" className={TAB_TRIGGER_CLASS}>
                <DollarSign className="h-4 w-4" />
                <span>Orders</span>
              </TabsTrigger>
              <TabsTrigger value="submissions" className={TAB_TRIGGER_CLASS}>
                <FileText className="h-4 w-4" />
                <span>Forms</span>
              </TabsTrigger>
              <TabsTrigger value="information" className={TAB_TRIGGER_CLASS}>
                <Info className="h-4 w-4" />
                <span>Info</span>
              </TabsTrigger>
              <TabsTrigger value="birds-eye-view" className={TAB_TRIGGER_CLASS}>
                <Eye className="h-4 w-4" />
                <span>Theater</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="products" className="space-y-6">
              <div className="flex flex-wrap justify-between items-center gap-3">
                <h2 className="text-xl font-semibold text-white">Products</h2>
                <Dialog open={showProductModal} onOpenChange={setShowProductModal}>
                  <DialogTrigger asChild>
                    <PrimaryButton onClick={() => setEditingItem(null)}>
                      <PlusCircle className="w-4 h-4 mr-2" />
                      Add Product
                    </PrimaryButton>
                  </DialogTrigger>
                  <DialogContent className="w-[95vw] max-w-2xl max-h-[85vh] overflow-y-auto bg-white/[0.02] backdrop-blur-3xl border border-white/10 shadow-2xl">
                    <DialogHeader>
                      <DialogTitle className="text-white">{editingItem ? 'Edit Product' : 'Add Product'}</DialogTitle>
                    </DialogHeader>
                    <ProductForm
                      product={editingItem}
                      onSubmit={handleProductSubmit}
                      onCancel={handleCancelEdit}
                    />
                  </DialogContent>
                </Dialog>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => (
                  <div key={product._id} className="bg-white/[0.02] backdrop-blur-3xl border border-white/10 shadow-2xl rounded-xl p-6">
                    <div className="flex justify-between items-start gap-2 mb-4">
                      <h3 className="text-white text-lg font-semibold break-words min-w-0">{product.name}</h3>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleEdit('product', product)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteProduct(product._id)}
                          className="bg-red-600/20 hover:bg-red-600/40 text-red-200 border-red-600/30"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm text-gray-300">
                      <p><strong>Price:</strong> ${product.price}</p>
                      <p><strong>Category:</strong> {product.category}</p>
                      <p><strong>Organization:</strong> {product.organization}</p>

                      {product.category === 'Apparel' ? (
                        <div>
                          <p><strong>Size & Stock:</strong></p>
                          {product.sizeStock && product.sizeStock.length > 0 ? (
                            <div className="ml-4 text-sm">
                              {product.sizeStock.map((item, idx) => (
                                <span key={idx} className="inline-block mr-3">
                                  {item.size}: {item.stock}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-gray-400 ml-4">No sizes configured</span>
                          )}
                        </div>
                      ) : (
                        <p><strong>Stock:</strong> {product.stock}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="events" className="space-y-6">
              <div className="flex flex-wrap justify-between items-center gap-3">
                <h2 className="text-xl font-semibold text-white">Events</h2>
                <Dialog open={showEventModal} onOpenChange={setShowEventModal}>
                  <DialogTrigger asChild>
                    <PrimaryButton onClick={() => setEditingItem(null)}>
                      <PlusCircle className="w-4 h-4 mr-2" />
                      Add Event
                    </PrimaryButton>
                  </DialogTrigger>
                  <DialogContent className="w-[95vw] max-w-2xl max-h-[85vh] overflow-y-auto bg-white/[0.02] backdrop-blur-3xl border border-white/10 shadow-2xl">
                    <DialogHeader>
                      <DialogTitle className="text-white">{editingItem ? 'Edit Event' : 'Add Event'}</DialogTitle>
                    </DialogHeader>
                    <EventForm
                      event={editingItem}
                      onSubmit={handleEventSubmit}
                      onCancel={handleCancelEdit}
                    />
                  </DialogContent>
                </Dialog>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {events.map((event) => (
                  <div key={event._id} className="bg-white/[0.02] backdrop-blur-3xl border border-white/10 shadow-2xl rounded-xl p-6">
                    <div className="flex justify-between items-start gap-2 mb-4">
                      <h3 className="text-white text-lg font-semibold break-words min-w-0">{event.title}</h3>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleEdit('event', event)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteEvent(event._id)}
                          className="bg-red-600/20 hover:bg-red-600/40 text-red-200 border-red-600/30"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm text-gray-300">
                      <p><strong>Date:</strong> {new Date(event.date).toLocaleDateString()}</p>
                      <p><strong>Time:</strong> {event.time}</p>
                      <p><strong>Location:</strong> {event.location}</p>
                      <p><strong>Category:</strong> {event.category}</p>
                      {event.ticketTypes && Array.isArray(event.ticketTypes) && event.ticketTypes.length > 0 && (
                        <div>
                          <p><strong>Ticket Types:</strong></p>
                          {event.ticketTypes.map((ticket, idx) => (
                            <div key={idx} className="ml-4 text-sm">
                              {ticket.name}: ${ticket.price}
                            </div>
                          ))}
                        </div>
                      )}
                      <p><strong>Requires Approval:</strong> {event.requiresApproval ? 'Yes' : 'No'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="orders" className="space-y-6">
              <OrdersManagement
                purchases={purchases}
                onUpdatePurchase={(id, data) => {
                  setPurchases(purchases.map(p => p._id === id ? { ...p, ...data } : p));
                }}
                onRefreshData={async () => {
                  const updatedPurchases = await getPurchases();
                  setPurchases(updatedPurchases);
                }}
              />
            </TabsContent>

            <TabsContent value="submissions" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white/[0.02] backdrop-blur-3xl border border-white/10 shadow-2xl rounded-xl p-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Filter by Event</label>
                  <Select value={submissionEventFilter} onValueChange={setSubmissionEventFilter}>
                    <SelectTrigger className="bg-white/[0.02] backdrop-blur-3xl border border-white/10 text-white shadow-lg">
                      <SelectValue placeholder="All Events" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Events</SelectItem>
                      {events.map((event) => (
                        <SelectItem key={event._id} value={event._id}>
                          {event.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Filter by Status</label>
                  <Select value={submissionStatusFilter} onValueChange={(value: 'all' | 'pending' | 'approved_paid' | 'approved_unpaid' | 'rejected') => setSubmissionStatusFilter(value)}>
                    <SelectTrigger className="bg-white/[0.02] backdrop-blur-3xl border border-white/10 text-white shadow-lg">
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved_unpaid">Approved (Unpaid)</SelectItem>
                      <SelectItem value="approved_paid">Approved (Paid)</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Search by Name</label>
                  <Input
                    type="text"
                    placeholder="Search by student name..."
                    value={submissionSearch}
                    onChange={(e) => setSubmissionSearch(e.target.value)}
                    className="bg-white/[0.02] backdrop-blur-3xl border border-white/10 text-white placeholder-gray-400 shadow-lg"
                  />
                </div>
              </div>

              <Card className="bg-white/[0.02] backdrop-blur-3xl border border-white/10 shadow-2xl">
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-center flex-wrap gap-3">
                    <div className="flex gap-3 flex-wrap">
                      <Badge variant="outline" className="bg-yellow-600/20 border-yellow-600/30 text-yellow-200 text-xs px-2 py-1">
                        Pending: {formSubmissions.filter(sub => sub.status === 'pending').length}
                      </Badge>
                      <Badge variant="outline" className="bg-orange-500/20 border-orange-500/30 text-orange-200 text-xs px-2 py-1">
                        Approved (Unpaid): {formSubmissions.filter(sub => sub.status === 'approved').length}
                      </Badge>
                      <Badge variant="outline" className="bg-green-600/20 border-green-600/30 text-green-200 text-xs px-2 py-1">
                        Approved (Paid): {formSubmissions.filter(sub => sub.status === 'paid').length}
                      </Badge>
                      <Badge variant="outline" className="bg-red-600/20 border-red-600/30 text-red-200 text-xs px-2 py-1">
                        Rejected: {formSubmissions.filter(sub => sub.status === 'rejected').length}
                      </Badge>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSubmissionSortOrder(prev => prev === 'newest' ? 'oldest' : 'newest')}
                      className="bg-white/5 hover:bg-white/10 text-white border-white/20"
                    >
                      {submissionSortOrder === 'newest'
                        ? <><ArrowDown className="w-4 h-4 mr-1" /> Newest First</>
                        : <><ArrowUp className="w-4 h-4 mr-1" /> Oldest First</>}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {filteredFormSubmissions.slice(0, submissionDisplayCount).map((submission) => {
                      const eventIdStr = resolveEventId(submission.eventId);
                      const relatedEvent = events.find(e => e._id === eventIdStr) ||
                        (typeof submission.eventId === 'object' ? submission.eventId as any : null);

                      return (
                        <div key={submission._id} className="bg-white/[0.02] backdrop-blur-3xl border border-white/10 shadow-lg rounded-lg p-4">
                          <div className="flex flex-wrap justify-between items-start gap-2 mb-2">
                            <div className="min-w-0">
                              <h4 className="text-white font-semibold text-lg break-words">{submission.studentName}</h4>
                              <p className="text-sm text-gray-400 break-words">{submission.email}</p>
                            </div>
                            <Badge className={`${getSubmissionStatusColor(submission.status)} flex-shrink-0`}>
                              {getSubmissionStatusLabel(submission.status)}
                            </Badge>
                          </div>

                          {relatedEvent && (
                            <div className="bg-white/10 rounded-lg p-2 mb-3">
                              <p className="text-white font-medium break-words">{relatedEvent.title}</p>
                              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-gray-300">
                                <span>{new Date(relatedEvent.date).toLocaleDateString()}</span>
                                <span>{relatedEvent.time}</span>
                                <span>{relatedEvent.location}</span>
                              </div>
                            </div>
                          )}

                          <div className="flex items-center gap-2 mb-3 flex-wrap">
                            {submission.ticketType && (
                              <Badge variant="outline" className="bg-purple-500/20 border-purple-500/30 text-purple-200">
                                {submission.ticketType.name} - ${submission.ticketType.price.toFixed(2)}
                              </Badge>
                            )}
                            <Badge variant="outline" className="bg-gray-500/20 border-gray-500/30 text-gray-200">
                              {new Date(submission.submissionDate).toLocaleDateString()} {new Date(submission.submissionDate).toLocaleTimeString()}
                            </Badge>
                            {submission.reviewedAt && (
                              <Badge variant="outline" className="bg-blue-500/20 border-blue-500/30 text-blue-200">
                                Reviewed: {new Date(submission.reviewedAt).toLocaleDateString()}
                              </Badge>
                            )}
                          </div>

                          {submission.forms && submission.forms.length > 0 && (
                            <div className="mb-3">
                              <p className="text-sm font-medium text-white mb-1">Uploaded Forms:</p>
                              <div className="flex flex-wrap gap-2">
                                {submission.forms.map((form, index) => (
                                  <div key={index} className="flex items-center max-w-full bg-white/10 px-3 py-1 rounded-full text-xs text-white">
                                    <FileText className="w-3 h-3 mr-1 flex-shrink-0" />
                                    <span className="truncate">{form.fileName}</span>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-5 w-5 p-0 ml-1 text-blue-300 hover:text-blue-100"
                                      onClick={() => window.open(form.fileUrl, '_blank')}
                                    >
                                      <Eye className="h-3 w-3" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {submission.notes && (
                            <div className="bg-white/5 rounded p-2 mb-3">
                              <p className="text-xs text-gray-400">Notes:</p>
                              <p className="text-sm text-white break-words">{submission.notes}</p>
                            </div>
                          )}

                          {submission.status === 'rejected' && submission.rejectionReason && (
                            <div className="bg-red-500/10 rounded p-2 mb-3">
                              <p className="text-xs text-red-400">Rejection Reason:</p>
                              <p className="text-sm text-red-200 break-words">{submission.rejectionReason}</p>
                            </div>
                          )}

                          <div className="mt-3 flex flex-wrap justify-end gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-xs text-blue-300 hover:text-blue-100"
                              onClick={() => handleViewSubmissionDetails(submission)}
                            >
                              <Eye className="w-3 h-3 mr-1" /> View Details
                            </Button>
                            {submission.status === 'pending' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="bg-green-600/20 hover:bg-green-600 text-green-200 hover:text-white border-green-600/30"
                                  onClick={() => handleApproveSubmission(submission._id)}
                                >
                                  <Check className="w-4 h-4 mr-1" /> Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="bg-red-600/20 hover:bg-red-600 text-red-200 hover:text-white border-red-600/30"
                                  onClick={() => handleRejectWithReason(submission._id)}
                                >
                                  <X className="w-4 h-4 mr-1" /> Reject
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {filteredFormSubmissions.length === 0 && (
                      <div className="text-center py-8 text-gray-400">
                        <FileText className="w-16 h-16 mx-auto mb-4 text-gray-500 opacity-30" />
                        <p className="text-lg">No submissions found</p>
                        <p className="text-sm mt-2">Try adjusting your filters</p>
                      </div>
                    )}

                    {filteredFormSubmissions.length > submissionDisplayCount && (
                      <div className="text-center py-4">
                        <Button
                          variant="outline"
                          onClick={() => setSubmissionDisplayCount(prev => prev + 10)}
                          className="bg-white/5 hover:bg-white/10 text-white border-white/20"
                        >
                          Load More ({filteredFormSubmissions.length - submissionDisplayCount} remaining)
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="information" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-white/[0.02] backdrop-blur-3xl border border-white/10 shadow-2xl">
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-white">Student Government</CardTitle>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingItem(null);
                          setShowStudentGovModal(true);
                        }}
                      >
                        <PlusCircle className="w-4 h-4 mr-1" /> Add
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4 max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent" style={{ scrollbarWidth: 'thin' }}>
                      {studentGov.map((position) => (
                        <div key={position._id} className="flex justify-between items-center gap-2">
                          <div className="min-w-0">
                            <h4 className="text-white font-semibold break-words">{position.position}</h4>
                            <p className="text-sm text-gray-400 break-words">{position.gradeLevel}</p>
                          </div>
                          <div className="flex gap-2 flex-shrink-0">
                            <Button
                              size="sm"
                              variant="outline"
                              className={ICON_BUTTON_CLASS}
                              onClick={() => {
                                setEditingItem(position);
                                setShowStudentGovModal(true);
                              }}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              className={ICON_BUTTON_CLASS}
                              onClick={() => handleDeleteStudentGov(position._id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-white/[0.02] backdrop-blur-3xl border border-white/10 shadow-2xl">
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-white">Clubs</CardTitle>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingItem(null);
                          setShowClubModal(true);
                        }}
                      >
                        <PlusCircle className="w-4 h-4 mr-1" /> Add
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4 max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent" style={{ scrollbarWidth: 'thin' }}>
                      {clubs.map((club) => (
                        <div key={club._id} className="flex justify-between items-center gap-2">
                          <div className="min-w-0">
                            <h4 className="text-white font-semibold break-words">{club.name}</h4>
                            <p className="text-sm text-gray-400 break-words">{club.contactEmail}</p>
                          </div>
                          <div className="flex gap-2 flex-shrink-0">
                            <Button
                              size="sm"
                              variant="outline"
                              className={ICON_BUTTON_CLASS}
                              onClick={() => {
                                setEditingItem(club);
                                setShowClubModal(true);
                              }}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              className={ICON_BUTTON_CLASS}
                              onClick={() => handleDeleteClub(club._id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-white/[0.02] backdrop-blur-3xl border border-white/10 shadow-2xl">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-white">Announcements</CardTitle>
                    <Dialog open={showAnnouncementModal} onOpenChange={setShowAnnouncementModal}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" onClick={() => setEditingItem(null)}>
                          <PlusCircle className="w-4 h-4 mr-1" /> Add Announcement
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="w-[95vw] max-w-2xl max-h-[85vh] overflow-y-auto bg-white/[0.02] backdrop-blur-3xl border border-white/10 shadow-2xl">
                        <DialogHeader>
                          <DialogTitle className="text-white">{editingItem ? 'Edit Announcement' : 'Add Announcement'}</DialogTitle>
                        </DialogHeader>
                        <AnnouncementForm
                          announcement={editingItem}
                          onSubmit={handleAnnouncementSubmit}
                          onCancel={() => {
                            setEditingItem(null);
                            setShowAnnouncementModal(false);
                          }}
                        />
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent" style={{ scrollbarWidth: 'thin' }}>
                    {announcements.map((announcement) => (
                      <div key={announcement._id} className="flex justify-between items-start p-3 bg-white/5 rounded-lg border border-white/10">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-white font-semibold text-sm break-words">{announcement.title}</h4>
                          <p className="text-gray-400 text-xs mt-1 break-words">
                            {announcement.content.length > 80
                              ? `${announcement.content.substring(0, 80)}...`
                              : announcement.content}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline" className={`text-xs px-2 py-1 ${
                              announcement.priority === 'high' ? 'bg-red-600/20 border-red-600/30 text-red-200' :
                              announcement.priority === 'medium' ? 'bg-yellow-600/20 border-yellow-600/30 text-yellow-200' :
                              'bg-green-600/20 border-green-600/30 text-green-200'
                            }`}>
                              {announcement.priority}
                            </Badge>
                            <span className="text-xs text-gray-400">
                              {new Date(announcement.date).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-1 ml-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className={ICON_BUTTON_CLASS}
                            onClick={() => {
                              setEditingItem(announcement);
                              setShowAnnouncementModal(true);
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className={ICON_BUTTON_CLASS}
                            onClick={() => handleDeleteAnnouncement(announcement._id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}

                    {announcements.length === 0 && (
                      <div className="text-center py-8 text-gray-400">
                        <Info className="w-12 h-12 mx-auto mb-2 text-gray-500 opacity-30" />
                        <p className="text-sm">No announcements yet</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="birds-eye-view" className="space-y-6">
              <div className="flex flex-wrap justify-between items-center gap-3">
                <h2 className="text-xl font-semibold text-white">Birds Eye View Videos</h2>
                <Dialog open={showVideoModal} onOpenChange={setShowVideoModal}>
                  <DialogTrigger asChild>
                    <PrimaryButton onClick={() => setEditingItem(null)}>
                      <PlusCircle className="w-4 h-4 mr-2" />
                      Add Video
                    </PrimaryButton>
                  </DialogTrigger>
                  <DialogContent className="w-[95vw] max-w-2xl max-h-[85vh] overflow-y-auto bg-white/[0.02] backdrop-blur-3xl border border-white/10 shadow-2xl">
                    <DialogHeader>
                      <DialogTitle className="text-white">{editingItem ? 'Edit Video' : 'Add New Video'}</DialogTitle>
                    </DialogHeader>
                    <VideoForm
                      video={editingItem}
                      onSubmit={handleVideoSubmit}
                      onCancel={() => {
                        setEditingItem(null);
                        setShowVideoModal(false);
                      }}
                    />
                  </DialogContent>
                </Dialog>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {videos.map((video) => (
                  <div key={video._id} className="bg-white/[0.02] backdrop-blur-3xl border border-white/10 shadow-2xl rounded-xl overflow-hidden">
                    <div className="aspect-video relative">
                      <img
                        src={video.thumbnailUrl}
                        alt={video.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 focus-within:opacity-100 transition-opacity">
                        <Button
                          variant="outline"
                          className="rounded-full"
                          onClick={() => {
                            const modal = document.createElement('div');
                            modal.className = 'fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4';
                            modal.onclick = (e) => {
                              if (e.target === modal) {
                                document.body.removeChild(modal);
                              }
                            };

                            let embedUrl = video.videoUrl;
                            if (embedUrl.includes('youtube.com/watch')) {
                              const videoId = embedUrl.split('v=')[1]?.split('&')[0];
                              embedUrl = `https://www.youtube.com/embed/${videoId}`;
                            } else if (embedUrl.includes('youtu.be/')) {
                              const videoId = embedUrl.split('youtu.be/')[1]?.split('?')[0];
                              embedUrl = `https://www.youtube.com/embed/${videoId}`;
                            }

                            modal.innerHTML = `
                              <div class="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl overflow-hidden max-w-4xl w-full">
                                <div class="flex justify-between items-center p-4 border-b border-white/20">
                                  <h3 class="text-white text-lg font-semibold">${video.title}</h3>
                                  <button onclick="document.body.removeChild(this.closest('.fixed'))" class="text-white/60 hover:text-white text-2xl">&times;</button>
                                </div>
                                <div class="aspect-video">
                                  <iframe
                                    src="${embedUrl}"
                                    frameborder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowfullscreen
                                    class="w-full h-full"
                                  ></iframe>
                                </div>
                              </div>
                            `;

                            document.body.appendChild(modal);
                          }}
                        >
                          <Eye className="w-5 h-5" />
                        </Button>
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="flex justify-between items-start gap-2 mb-2">
                        <h3 className="text-white text-lg font-semibold break-words min-w-0">{video.title}</h3>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingItem(video);
                              setShowVideoModal(true);
                            }}
                            className={ICON_BUTTON_CLASS}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleDeleteVideo(video._id)} className={ICON_BUTTON_CLASS}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="text-sm text-gray-400 mb-2">
                        {video.description.length > 60
                          ? `${video.description.substring(0, 60)}...`
                          : video.description}
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge>{video.category}</Badge>
                          {video.featured && <Badge variant="secondary">Featured</Badge>}
                        </div>
                        <span className="text-sm text-gray-400">{video.views} views</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>
      <Dialog open={showRejectionModal} onOpenChange={setShowRejectionModal}>
        <DialogContent className="w-[95vw] max-w-md max-h-[85vh] overflow-y-auto bg-white/[0.02] backdrop-blur-3xl border border-white/10 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">Reject Form Submission</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-300">
              Please provide a reason for rejecting this form submission:
            </p>
            <Textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter rejection reason..."
              rows={4}
              className={GLASS_FIELD_CLASS}
            />
            <div className="flex flex-wrap gap-3 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowRejectionModal(false);
                  setRejectionReason('');
                  setRejectionSubmissionId('');
                }}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={confirmRejection}
                disabled={!rejectionReason.trim()}
                className="bg-red-600/20 hover:bg-red-600/40 text-red-200 border-red-600/30"
              >
                <X className="h-4 w-4 mr-1" />
                Reject Submission
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showSubmissionDetailModal} onOpenChange={setShowSubmissionDetailModal}>
        <DialogContent className="w-[95vw] max-w-4xl max-h-[85vh] overflow-y-auto bg-white/[0.02] backdrop-blur-3xl border border-white/10 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">Submission Details</DialogTitle>
          </DialogHeader>
          {selectedSubmission && (
            <div className="space-y-6 text-white">
              <div className="bg-white/10 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-3">Student Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="min-w-0">
                    <label className="text-sm text-gray-300">Name:</label>
                    <p className="text-white font-medium break-words">{selectedSubmission.studentName}</p>
                  </div>
                  <div className="min-w-0">
                    <label className="text-sm text-gray-300">Email:</label>
                    <p className="text-white break-words">{selectedSubmission.email}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-300">Status:</label>
                    <Badge className={getSubmissionStatusColor(selectedSubmission.status)}>
                      {getSubmissionStatusLabel(selectedSubmission.status)}
                    </Badge>
                  </div>
                  <div>
                    <label className="text-sm text-gray-300">Submission Date:</label>
                    <p className="text-white">{new Date(selectedSubmission.submissionDate).toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {(() => {
                const eventIdStr = resolveEventId(selectedSubmission.eventId);
                const relatedEvent = events.find(e => e._id === eventIdStr) ||
                  (typeof selectedSubmission.eventId === 'object' ? selectedSubmission.eventId as any : null);

                return relatedEvent && (
                  <div className="bg-white/10 rounded-lg p-4">
                    <h3 className="text-lg font-semibold mb-3">Event Information</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="min-w-0">
                        <label className="text-sm text-gray-300">Event:</label>
                        <p className="text-white font-medium break-words">{relatedEvent.title}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-300">Date:</label>
                        <p className="text-white">{new Date(relatedEvent.date).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-300">Time:</label>
                        <p className="text-white">{relatedEvent.time}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-300">Location:</label>
                        <p className="text-white">{relatedEvent.location}</p>
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div className="bg-white/10 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-3">Registration Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm text-gray-300">Quantity:</label>
                    <p className="text-white font-medium">{selectedSubmission.quantity}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-300">Total Amount:</label>
                    <p className="text-white font-medium">${(selectedSubmission.totalAmount || 0).toFixed(2)}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-300">Payment Status:</label>
                    <p className="text-white">
                      {selectedSubmission.status === 'paid' || selectedSubmission.purchaseStatus === 'completed' ? 'Paid' : 'Pending'}
                    </p>
                    {selectedSubmission.paymentDate && (
                      <p className="text-xs text-gray-300">
                        Paid on {new Date(selectedSubmission.paymentDate).toLocaleDateString()}
                      </p>
                    )}
                    {selectedSubmission.transactionId && (
                      <p className="text-xs text-gray-300 break-words">
                        Transaction: {selectedSubmission.transactionId}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {selectedSubmission.forms && selectedSubmission.forms.length > 0 && (
                <div className="bg-white/10 rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-3">Uploaded Forms</h3>
                  <div className="space-y-2">
                    {selectedSubmission.forms.map((form, index) => (
                      <div key={index} className="flex items-center justify-between bg-white/5 p-3 rounded-lg">
                        <div className="flex items-center">
                          <FileText className="w-4 h-4 mr-2 text-blue-400" />
                          <span className="text-white break-words">{form.fileName}</span>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(form.fileUrl, '_blank')}
                          className="bg-blue-600/20 hover:bg-blue-600/40 text-blue-200 border-blue-600/30"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedSubmission.notes && (
                <div className="bg-white/10 rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-3">Additional Notes</h3>
                  <p className="text-white break-words">{selectedSubmission.notes}</p>
                </div>
              )}

              {selectedSubmission.status === 'rejected' && selectedSubmission.rejectionReason && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-3 text-red-200">Rejection Reason</h3>
                  <p className="text-red-100 break-words">{selectedSubmission.rejectionReason}</p>
                </div>
              )}

              {selectedSubmission.reviewedAt && (
                <div className="bg-white/5 rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-3">Review Information</h3>
                  <p className="text-gray-300">
                    Reviewed on: {new Date(selectedSubmission.reviewedAt).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showStudentGovModal} onOpenChange={setShowStudentGovModal}>
        <DialogContent className="w-[95vw] max-w-2xl max-h-[85vh] overflow-y-auto bg-white/[0.02] backdrop-blur-3xl border border-white/10 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">{editingItem ? 'Edit Position' : 'Add Position'}</DialogTitle>
          </DialogHeader>
          <StudentGovForm
            member={editingItem}
            onSubmit={handleStudentGovSubmit}
            onCancel={() => {
              setEditingItem(null);
              setShowStudentGovModal(false);
            }}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={showClubModal} onOpenChange={setShowClubModal}>
        <DialogContent className="w-[95vw] max-w-2xl max-h-[85vh] overflow-y-auto bg-white/[0.02] backdrop-blur-3xl border border-white/10 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">{editingItem ? 'Edit Club' : 'Add Club'}</DialogTitle>
          </DialogHeader>
          <ClubForm
            club={editingItem}
            onSubmit={handleClubSubmit}
            onCancel={() => {
              setEditingItem(null);
              setShowClubModal(false);
            }}
          />
        </DialogContent>
      </Dialog>

    </div>
  );
}
