export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type FormFieldType = 'text' | 'textarea' | 'number' | 'date' | 'select'

export interface FormFieldSchema {
  id: string
  label: string
  type: FormFieldType
  required?: boolean
  options?: string[]
}

export interface Database {
  public: {
    Tables: {
      workspaces: {
        Row: {
          id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
        }
      }
      patients: {
        Row: {
          id: string
          workspace_id: string
          full_name: string
          email: string | null
          phone: string | null
          notes: string | null
          birth_date: string | null
          sex: string | null
          address: string | null
          cpf: string | null
          consultation_reason: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          full_name: string
          email?: string | null
          phone?: string | null
          notes?: string | null
          birth_date?: string | null
          sex?: string | null
          address?: string | null
          cpf?: string | null
          consultation_reason?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          workspace_id?: string
          full_name?: string
          email?: string | null
          phone?: string | null
          notes?: string | null
          birth_date?: string | null
          sex?: string | null
          address?: string | null
          cpf?: string | null
          consultation_reason?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      patient_history: {
        Row: {
          patient_id: string
          workspace_id: string
          profession: string | null
          smoker_status: string | null
          smoking_duration: string | null
          smoking_quit_duration: string | null
          practices_exercise: boolean | null
          consumes_alcohol: boolean | null
          comorbidity: string | null
          keloid_scar: string | null
          observation: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          patient_id: string
          workspace_id: string
          profession?: string | null
          smoker_status?: string | null
          smoking_duration?: string | null
          smoking_quit_duration?: string | null
          practices_exercise?: boolean | null
          consumes_alcohol?: boolean | null
          comorbidity?: string | null
          keloid_scar?: string | null
          observation?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          patient_id?: string
          workspace_id?: string
          profession?: string | null
          smoker_status?: string | null
          smoking_duration?: string | null
          smoking_quit_duration?: string | null
          practices_exercise?: boolean | null
          consumes_alcohol?: boolean | null
          comorbidity?: string | null
          keloid_scar?: string | null
          observation?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      patient_surgery: {
        Row: {
          patient_id: string
          workspace_id: string
          surgery_type: string | null
          surgeon_name: string | null
          surgeon_contact_phone: string | null
          post_op_duration_notes: string | null
          uses_compression_garment: boolean | null
          garment_type: string | null
          uses_compression_plate: boolean | null
          plate_type: string | null
          doctor_guidance: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          patient_id: string
          workspace_id: string
          surgery_type?: string | null
          surgeon_name?: string | null
          surgeon_contact_phone?: string | null
          post_op_duration_notes?: string | null
          uses_compression_garment?: boolean | null
          garment_type?: string | null
          uses_compression_plate?: boolean | null
          plate_type?: string | null
          doctor_guidance?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          patient_id?: string
          workspace_id?: string
          surgery_type?: string | null
          surgeon_name?: string | null
          surgeon_contact_phone?: string | null
          post_op_duration_notes?: string | null
          uses_compression_garment?: boolean | null
          garment_type?: string | null
          uses_compression_plate?: boolean | null
          plate_type?: string | null
          doctor_guidance?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      evolution_entries: {
        Row: {
          id: string
          patient_id: string
          workspace_id: string
          content: string
          entry_date: string
          created_at: string
        }
        Insert: {
          id?: string
          patient_id: string
          workspace_id: string
          content: string
          entry_date?: string
          created_at?: string
        }
        Update: {
          id?: string
          patient_id?: string
          workspace_id?: string
          content?: string
          entry_date?: string
          created_at?: string
        }
      }
      patient_documents: {
        Row: {
          id: string
          patient_id: string
          workspace_id: string
          storage_path: string
          file_name: string
          mime_type: string | null
          created_at: string
        }
        Insert: {
          id?: string
          patient_id: string
          workspace_id: string
          storage_path: string
          file_name: string
          mime_type?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          patient_id?: string
          workspace_id?: string
          storage_path?: string
          file_name?: string
          mime_type?: string | null
          created_at?: string
        }
      }
      form_templates: {
        Row: {
          id: string
          workspace_id: string
          title: string
          schema: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          title: string
          schema?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          workspace_id?: string
          title?: string
          schema?: Json
          created_at?: string
          updated_at?: string
        }
      }
      form_links: {
        Row: {
          id: string
          form_template_id: string
          workspace_id: string
          public_token: string
          expires_at: string | null
          patient_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          form_template_id: string
          workspace_id: string
          public_token?: string
          expires_at?: string | null
          patient_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          form_template_id?: string
          workspace_id?: string
          public_token?: string
          expires_at?: string | null
          patient_id?: string | null
          created_at?: string
        }
      }
      form_submissions: {
        Row: {
          id: string
          form_link_id: string
          form_template_id: string
          answers: Json
          created_at: string
        }
        Insert: {
          id?: string
          form_link_id: string
          form_template_id: string
          answers?: Json
          created_at?: string
        }
        Update: {
          id?: string
          form_link_id?: string
          form_template_id?: string
          answers?: Json
          created_at?: string
        }
      }
    }
    Views: Record<string, never>
    Functions: {
      submit_form_response: {
        Args: { p_token: string; p_answers: Json }
        Returns: string
      }
    }
    Enums: Record<string, never>
  }
}
