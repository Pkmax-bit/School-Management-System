/**
 * Utility functions for uploading files to Supabase Storage
 */

import { supabase } from './supabase';

export interface UploadResult {
  url: string;
  path: string;
  name?: string;
  size?: number;
  type?: string;
  error?: string;
}

export interface UploadOptions {
  classNames?: string[];
  className?: string;
  assignmentType?: string;
  assignmentId?: string;
  subfolder?: string;
}

const sanitizeSegment = (value?: string | null) => {
  if (!value) return 'general';
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'general';
};

const buildFilePath = (
  file: File,
  options?: UploadOptions,
  defaultSubfolder: string = 'misc'
) => {
  const classSegment = sanitizeSegment(
    options?.classNames?.[0] || options?.className
  );
  const typeSegment = sanitizeSegment(options?.assignmentType);
  const assignmentSegment = sanitizeSegment(options?.assignmentId || 'common');
  const subfolderSegment = sanitizeSegment(options?.subfolder || defaultSubfolder);
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 10);
  const fileExt = file.name.split('.').pop();
  return `${classSegment}/${typeSegment}/${assignmentSegment}/${subfolderSegment}/${timestamp}-${randomString}.${fileExt}`;
};

const uploadToBucket = async (
  file: File,
  path: string
): Promise<UploadResult> => {
  // Debug: Check auth state before upload
  const { data: { session } } = await supabase.auth.getSession();
  console.log('Upload Debug - Session:', session ? 'Active' : 'None');
  console.log('Upload Debug - User Role:', session?.user?.role);
  console.log('Upload Debug - User Metadata:', session?.user?.user_metadata);

  const { data, error } = await supabase.storage
    .from('Assignments')
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) {
    console.error('Error uploading file:', error);
    return {
      url: '',
      path: '',
      error: error.message
    };
  }

  const { data: urlData } = supabase.storage
    .from('Assignments')
    .getPublicUrl(data.path);

  return {
    url: urlData.publicUrl,
    path: data.path,
    name: file.name,
    size: file.size,
    type: file.type
  };
};

/**
 * Upload image to Supabase Storage bucket "Assignments"
 */
export async function uploadImageToAssignments(
  file: File,
  options?: UploadOptions
): Promise<UploadResult> {
  try {
    const filePath = buildFilePath(file, options, options?.subfolder || 'questions');
    return await uploadToBucket(file, filePath);
  } catch (error: any) {
    console.error('Error in uploadImageToAssignments:', error);
    return {
      url: '',
      path: '',
      error: error.message || 'Failed to upload file'
    };
  }
}

/**
 * Upload file (Word, ZIP, etc.) to Supabase Storage bucket "Assignments"
 */
export async function uploadFileToAssignments(
  file: File,
  options?: UploadOptions
): Promise<UploadResult> {
  try {
    const filePath = buildFilePath(file, options, options?.subfolder || 'submissions');
    return await uploadToBucket(file, filePath);
  } catch (error: any) {
    console.error('Error in uploadFileToAssignments:', error);
    return {
      url: '',
      path: '',
      error: error.message || 'Failed to upload file'
    };
  }
}

/**
 * Delete file from Supabase Storage bucket "Assignments"
 * @param path - Path of the file to delete
 * @returns Promise with success status
 */
export async function deleteFileFromAssignments(path: string): Promise<boolean> {
  try {
    const { error } = await supabase.storage
      .from('Assignments')
      .remove([path]);

    if (error) {
      console.error('Error deleting file:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteFileFromAssignments:', error);
    return false;
  }
}

const uploadToLessonsBucket = async (
  file: File,
  path: string
): Promise<UploadResult> => {
  // Debug: Check auth state before upload
  const { data: { session } } = await supabase.auth.getSession();
  console.log('Upload Debug - Session:', session ? 'Active' : 'None');
  console.log('Upload Debug - User Role:', session?.user?.role);
  console.log('Upload Debug - User Metadata:', session?.user?.user_metadata);

  const { data, error } = await supabase.storage
    .from('lesson-materials')
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) {
    console.error('Error uploading file:', error);
    return {
      url: '',
      path: '',
      error: error.message
    };
  }

  const { data: urlData } = supabase.storage
    .from('lesson-materials')
    .getPublicUrl(data.path);

  return {
    url: urlData.publicUrl,
    path: data.path,
    name: file.name,
    size: file.size,
    type: file.type
  };
};

const buildLessonFilePath = (
  file: File,
  classroomId: string
) => {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 10);
  const fileExt = file.name.split('.').pop();
  return `${classroomId}/${timestamp}-${randomString}.${fileExt}`;
};

/**
 * Upload lesson file to Supabase Storage bucket "lesson-materials"
 */
export async function uploadLessonFile(
  file: File,
  classroomId: string
): Promise<UploadResult> {
  try {
    const filePath = buildLessonFilePath(file, classroomId);
    return await uploadToLessonsBucket(file, filePath);
  } catch (error: any) {
    console.error('Error in uploadLessonFile:', error);
    return {
      url: '',
      path: '',
      error: error.message || 'Failed to upload lesson file'
    };
  }
}

/**
 * Delete lesson file from Supabase Storage bucket "lesson-materials"
 * @param path - Path of the file to delete
 * @returns Promise with success status
 */
export async function deleteLessonFile(path: string): Promise<boolean> {
  try {
    const { error } = await supabase.storage
      .from('lesson-materials')
      .remove([path]);

    if (error) {
      console.error('Error deleting lesson file:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteLessonFile:', error);
    return false;
  }
}

