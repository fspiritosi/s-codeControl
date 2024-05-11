export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      brand_vehicles: {
        Row: {
          created_at: string
          id: number
          name: string | null
        }
        Insert: {
          created_at?: string
          id?: number
          name?: string | null
        }
        Update: {
          created_at?: string
          id?: number
          name?: string | null
        }
        Relationships: []
      }
      cities: {
        Row: {
          created_at: string
          id: number
          name: string
          province_id: number
        }
        Insert: {
          created_at?: string
          id?: number
          name: string
          province_id: number
        }
        Update: {
          created_at?: string
          id?: number
          name?: string
          province_id?: number
        }
        Relationships: [
          {
            foreignKeyName: 'cities_province_id_fkey'
            columns: ['province_id']
            isOneToOne: false
            referencedRelation: 'provinces'
            referencedColumns: ['id']
          },
        ]
      }
      companies_employees: {
        Row: {
          company_id: string | null
          employee_id: string
          id: string
        }
        Insert: {
          company_id?: string | null
          employee_id: string
          id?: string
        }
        Update: {
          company_id?: string | null
          employee_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'companies_employees_company_id_fkey'
            columns: ['company_id']
            isOneToOne: false
            referencedRelation: 'company'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'companies_employees_employee_id_fkey'
            columns: ['employee_id']
            isOneToOne: false
            referencedRelation: 'employees'
            referencedColumns: ['id']
          },
        ]
      }
      company: {
        Row: {
          address: string
          by_defect: boolean | null
          city: number
          company_cuit: string
          company_logo: string | null
          company_name: string
          contact_email: string
          contact_phone: string
          country: string
          description: string
          id: string
          industry: string
          is_active: boolean
          owner_id: string | null
          province_id: number | null
          website: string | null
        }
        Insert: {
          address: string
          by_defect?: boolean | null
          city: number
          company_cuit: string
          company_logo?: string | null
          company_name: string
          contact_email: string
          contact_phone: string
          country: string
          description: string
          id?: string
          industry: string
          is_active?: boolean
          owner_id?: string | null
          province_id?: number | null
          website?: string | null
        }
        Update: {
          address?: string
          by_defect?: boolean | null
          city?: number
          company_cuit?: string
          company_logo?: string | null
          company_name?: string
          contact_email?: string
          contact_phone?: string
          country?: string
          description?: string
          id?: string
          industry?: string
          is_active?: boolean
          owner_id?: string | null
          province_id?: number | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'company_city_fkey'
            columns: ['city']
            isOneToOne: false
            referencedRelation: 'cities'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'company_owner_id_fkey'
            columns: ['owner_id']
            isOneToOne: false
            referencedRelation: 'profile'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'company_province_id_fkey'
            columns: ['province_id']
            isOneToOne: false
            referencedRelation: 'provinces'
            referencedColumns: ['id']
          },
        ]
      }
      contractor_employee: {
        Row: {
          contractor_id: string | null
          created_at: string
          employee_id: string | null
          id: string
        }
        Insert: {
          contractor_id?: string | null
          created_at?: string
          employee_id?: string | null
          id?: string
        }
        Update: {
          contractor_id?: string | null
          created_at?: string
          employee_id?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'contractor_employee_contractor_id_fkey'
            columns: ['contractor_id']
            isOneToOne: false
            referencedRelation: 'contractors'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'contractor_employee_employee_id_fkey'
            columns: ['employee_id']
            isOneToOne: false
            referencedRelation: 'employees'
            referencedColumns: ['id']
          },
        ]
      }
      contractors: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      countries: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      document_types: {
        Row: {
          applies: Database['public']['Enums']['document_applies']
          company_id: string | null
          created_at: string
          description: string | null
          explired: boolean
          id: string
          is_active: boolean
          mandatory: boolean
          multiresource: boolean
          name: string
          special: boolean
        }
        Insert: {
          applies: Database['public']['Enums']['document_applies']
          company_id?: string | null
          created_at?: string
          description?: string | null
          explired: boolean
          id?: string
          is_active?: boolean
          mandatory: boolean
          multiresource: boolean
          name: string
          special: boolean
        }
        Update: {
          applies?: Database['public']['Enums']['document_applies']
          company_id?: string | null
          created_at?: string
          description?: string | null
          explired?: boolean
          id?: string
          is_active?: boolean
          mandatory?: boolean
          multiresource?: boolean
          name?: string
          special?: boolean
        }
        Relationships: [
          {
            foreignKeyName: 'document_types_company_id_fkey'
            columns: ['company_id']
            isOneToOne: false
            referencedRelation: 'company'
            referencedColumns: ['id']
          },
        ]
      }
      documents_employees: {
        Row: {
          applies: string | null
          created_at: string
          deny_reason: string | null
          document_path: string | null
          id: string
          id_document_types: string | null
          is_active: boolean | null
          state: Database['public']['Enums']['state']
          user_id: string | null
          validity: string | null
        }
        Insert: {
          applies?: string | null
          created_at?: string
          deny_reason?: string | null
          document_path?: string | null
          id?: string
          id_document_types?: string | null
          is_active?: boolean | null
          state?: Database['public']['Enums']['state']
          user_id?: string | null
          validity?: string | null
        }
        Update: {
          applies?: string | null
          created_at?: string
          deny_reason?: string | null
          document_path?: string | null
          id?: string
          id_document_types?: string | null
          is_active?: boolean | null
          state?: Database['public']['Enums']['state']
          user_id?: string | null
          validity?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'documents_employees_applies_fkey'
            columns: ['applies']
            isOneToOne: false
            referencedRelation: 'employees'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'documents_employees_id_document_types_fkey'
            columns: ['id_document_types']
            isOneToOne: false
            referencedRelation: 'document_types'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'documents_employees_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profile'
            referencedColumns: ['id']
          },
        ]
      }
      documents_employees_logs: {
        Row: {
          documents_employees_id: string
          id: number
          modified_by: string
          updated_at: string
        }
        Insert: {
          documents_employees_id: string
          id?: number
          modified_by: string
          updated_at?: string
        }
        Update: {
          documents_employees_id?: string
          id?: number
          modified_by?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'public_documents_employees_logs_documents_employees_id_fkey'
            columns: ['documents_employees_id']
            isOneToOne: false
            referencedRelation: 'documents_employees'
            referencedColumns: ['id']
          },
        ]
      }
      documents_equipment: {
        Row: {
          applies: string | null
          created_at: string
          deny_reason: string | null
          document_path: string | null
          id: string
          id_document_types: string | null
          is_active: boolean | null
          state: Database['public']['Enums']['state'] | null
          user_id: string | null
          validity: string | null
        }
        Insert: {
          applies?: string | null
          created_at?: string
          deny_reason?: string | null
          document_path?: string | null
          id?: string
          id_document_types?: string | null
          is_active?: boolean | null
          state?: Database['public']['Enums']['state'] | null
          user_id?: string | null
          validity?: string | null
        }
        Update: {
          applies?: string | null
          created_at?: string
          deny_reason?: string | null
          document_path?: string | null
          id?: string
          id_document_types?: string | null
          is_active?: boolean | null
          state?: Database['public']['Enums']['state'] | null
          user_id?: string | null
          validity?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'documents_equipment_applies_fkey'
            columns: ['applies']
            isOneToOne: false
            referencedRelation: 'vehicles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'documents_equipment_id_document_types_fkey'
            columns: ['id_document_types']
            isOneToOne: false
            referencedRelation: 'document_types'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'documents_equipment_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profile'
            referencedColumns: ['id']
          },
        ]
      }
      documents_equipment_logs: {
        Row: {
          documents_equipment_id: string
          id: number
          modified_by: string
          updated_at: string
        }
        Insert: {
          documents_equipment_id: string
          id?: number
          modified_by: string
          updated_at?: string
        }
        Update: {
          documents_equipment_id?: string
          id?: number
          modified_by?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'public_documents_equipment_logs_documents_equipment_id_fkey'
            columns: ['documents_equipment_id']
            isOneToOne: false
            referencedRelation: 'documents_equipment'
            referencedColumns: ['id']
          },
        ]
      }
      employees: {
        Row: {
          affiliate_status:
            | Database['public']['Enums']['affiliate_status_enum']
            | null
          allocated_to: string[] | null
          birthplace: string
          city: number
          company_id: string | null
          company_position: string | null
          created_at: string
          cuil: string
          date_of_admission: string
          document_number: string
          document_type: Database['public']['Enums']['document_type_enum']
          email: string | null
          file: string
          firstname: string
          gender: Database['public']['Enums']['gender_enum'] | null
          hierarchical_position: string | null
          id: string
          is_active: boolean | null
          lastname: string
          level_of_education:
            | Database['public']['Enums']['level_of_education_enum']
            | null
          marital_status:
            | Database['public']['Enums']['marital_status_enum']
            | null
          nationality: Database['public']['Enums']['nationality_enum']
          normal_hours: string | null
          phone: string
          picture: string
          postal_code: string | null
          province: number
          reason_for_termination:
            | Database['public']['Enums']['reason_for_termination_enum']
            | null
          status: Database['public']['Enums']['status_type'] | null
          street: string
          street_number: string
          termination_date: string | null
          type_of_contract: Database['public']['Enums']['type_of_contract_enum']
          workflow_diagram: string | null
        }
        Insert: {
          affiliate_status?:
            | Database['public']['Enums']['affiliate_status_enum']
            | null
          allocated_to?: string[] | null
          birthplace: string
          city: number
          company_id?: string | null
          company_position?: string | null
          created_at?: string
          cuil: string
          date_of_admission: string
          document_number: string
          document_type: Database['public']['Enums']['document_type_enum']
          email?: string | null
          file: string
          firstname: string
          gender?: Database['public']['Enums']['gender_enum'] | null
          hierarchical_position?: string | null
          id?: string
          is_active?: boolean | null
          lastname: string
          level_of_education?:
            | Database['public']['Enums']['level_of_education_enum']
            | null
          marital_status?:
            | Database['public']['Enums']['marital_status_enum']
            | null
          nationality: Database['public']['Enums']['nationality_enum']
          normal_hours?: string | null
          phone: string
          picture: string
          postal_code?: string | null
          province: number
          reason_for_termination?:
            | Database['public']['Enums']['reason_for_termination_enum']
            | null
          status?: Database['public']['Enums']['status_type'] | null
          street: string
          street_number: string
          termination_date?: string | null
          type_of_contract: Database['public']['Enums']['type_of_contract_enum']
          workflow_diagram?: string | null
        }
        Update: {
          affiliate_status?:
            | Database['public']['Enums']['affiliate_status_enum']
            | null
          allocated_to?: string[] | null
          birthplace?: string
          city?: number
          company_id?: string | null
          company_position?: string | null
          created_at?: string
          cuil?: string
          date_of_admission?: string
          document_number?: string
          document_type?: Database['public']['Enums']['document_type_enum']
          email?: string | null
          file?: string
          firstname?: string
          gender?: Database['public']['Enums']['gender_enum'] | null
          hierarchical_position?: string | null
          id?: string
          is_active?: boolean | null
          lastname?: string
          level_of_education?:
            | Database['public']['Enums']['level_of_education_enum']
            | null
          marital_status?:
            | Database['public']['Enums']['marital_status_enum']
            | null
          nationality?: Database['public']['Enums']['nationality_enum']
          normal_hours?: string | null
          phone?: string
          picture?: string
          postal_code?: string | null
          province?: number
          reason_for_termination?:
            | Database['public']['Enums']['reason_for_termination_enum']
            | null
          status?: Database['public']['Enums']['status_type'] | null
          street?: string
          street_number?: string
          termination_date?: string | null
          type_of_contract?: Database['public']['Enums']['type_of_contract_enum']
          workflow_diagram?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'employees_birthplace_fkey'
            columns: ['birthplace']
            isOneToOne: false
            referencedRelation: 'countries'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'employees_city_fkey'
            columns: ['city']
            isOneToOne: false
            referencedRelation: 'cities'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'employees_company_id_fkey'
            columns: ['company_id']
            isOneToOne: false
            referencedRelation: 'company'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'employees_hierarchical_position_fkey'
            columns: ['hierarchical_position']
            isOneToOne: false
            referencedRelation: 'hierarchy'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'employees_province_fkey'
            columns: ['province']
            isOneToOne: false
            referencedRelation: 'provinces'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'employees_workflow_diagram_fkey'
            columns: ['workflow_diagram']
            isOneToOne: false
            referencedRelation: 'work-diagram'
            referencedColumns: ['id']
          },
        ]
      }
      hierarchy: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      industry_type: {
        Row: {
          created_at: string
          id: number
          name: string | null
        }
        Insert: {
          created_at?: string
          id?: number
          name?: string | null
        }
        Update: {
          created_at?: string
          id?: number
          name?: string | null
        }
        Relationships: []
      }
      model_vehicles: {
        Row: {
          brand: number | null
          created_at: string
          id: number
          name: string | null
        }
        Insert: {
          brand?: number | null
          created_at?: string
          id?: number
          name?: string | null
        }
        Update: {
          brand?: number | null
          created_at?: string
          id?: number
          name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'public_model_vehicles_brand_fkey'
            columns: ['brand']
            isOneToOne: false
            referencedRelation: 'brand_vehicles'
            referencedColumns: ['id']
          },
        ]
      }
      notifications: {
        Row: {
          category:
            | Database['public']['Enums']['notification_categories']
            | null
          company_id: string | null
          created_at: string | null
          description: string | null
          document_id: string | null
          id: string
          reference: string | null
          title: string | null
        }
        Insert: {
          category?:
            | Database['public']['Enums']['notification_categories']
            | null
          company_id?: string | null
          created_at?: string | null
          description?: string | null
          document_id?: string | null
          id?: string
          reference?: string | null
          title?: string | null
        }
        Update: {
          category?:
            | Database['public']['Enums']['notification_categories']
            | null
          company_id?: string | null
          created_at?: string | null
          description?: string | null
          document_id?: string | null
          id?: string
          reference?: string | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'public_notifications_company_id_fkey'
            columns: ['company_id']
            isOneToOne: false
            referencedRelation: 'company'
            referencedColumns: ['id']
          },
        ]
      }
      profile: {
        Row: {
          avatar: string | null
          created_at: string | null
          credential_id: string | null
          email: string | null
          fullname: string | null
          id: string
          role: string | null
        }
        Insert: {
          avatar?: string | null
          created_at?: string | null
          credential_id?: string | null
          email?: string | null
          fullname?: string | null
          id?: string
          role?: string | null
        }
        Update: {
          avatar?: string | null
          created_at?: string | null
          credential_id?: string | null
          email?: string | null
          fullname?: string | null
          id?: string
          role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'profile_credential_id_fkey'
            columns: ['credential_id']
            isOneToOne: true
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'profile_role_fkey'
            columns: ['role']
            isOneToOne: false
            referencedRelation: 'roles'
            referencedColumns: ['name']
          },
        ]
      }
      provinces: {
        Row: {
          created_at: string
          id: number
          name: string
        }
        Insert: {
          created_at?: string
          id?: number
          name: string
        }
        Update: {
          created_at?: string
          id?: number
          name?: string
        }
        Relationships: []
      }
      roles: {
        Row: {
          created_at: string
          id: number
          intern: boolean | null
          is_active: boolean | null
          name: string
        }
        Insert: {
          created_at?: string
          id?: number
          intern?: boolean | null
          is_active?: boolean | null
          name: string
        }
        Update: {
          created_at?: string
          id?: number
          intern?: boolean | null
          is_active?: boolean | null
          name?: string
        }
        Relationships: []
      }
      share_company_users: {
        Row: {
          company_id: string | null
          created_at: string
          id: string
          profile_id: string | null
          role: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          id?: string
          profile_id?: string | null
          role?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string
          id?: string
          profile_id?: string | null
          role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'public_share_company_users_company_id_fkey'
            columns: 'company_id'
            isOneToOne: true
            referencedRelation: 'company'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'public_share_company_users_profile_id_fkey'
            columns: ['profile_id']
            isOneToOne: false
            referencedRelation: 'profile'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'share_company_users_role_fkey'
            columns: ['role']
            isOneToOne: false
            referencedRelation: 'roles'
            referencedColumns: ['name']
          },
        ]
      }
      type: {
        Row: {
          created_at: string
          id: string
          name: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          name?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string | null
        }
        Relationships: []
      }
      types_of_vehicles: {
        Row: {
          created_at: string
          id: number
          name: string | null
        }
        Insert: {
          created_at?: string
          id?: number
          name?: string | null
        }
        Update: {
          created_at?: string
          id?: number
          name?: string | null
        }
        Relationships: []
      }
      vehicles: {
        Row: {
          allocated_to: string[] | null
          brand: number
          chassis: string | null
          company_id: string | null
          created_at: string
          domain: string | null
          engine: string
          id: string
          intern_number: string
          is_active: boolean | null
          model: number
          picture: string
          reason_for_termination: string | null
          serie: string | null
          status: Database['public']['Enums']['status_type'] | null
          termination_date: string | null
          type: string
          type_of_vehicle: number
          user_id: string | null
          year: string
        }
        Insert: {
          allocated_to?: string[] | null
          brand: number
          chassis?: string | null
          company_id?: string | null | undefined
          created_at?: string
          domain?: string | null
          engine: string
          id?: string
          intern_number: string
          is_active?: boolean | null
          model: number
          picture?: string
          reason_for_termination?: string | null
          serie?: string | null
          status?: Database['public']['Enums']['status_type'] | null
          termination_date?: string | null
          type: string
          type_of_vehicle: number
          user_id?: string | null
          year: string
        }
        Update: {
          allocated_to?: string[] | null
          brand?: number
          chassis?: string | null
          company_id?: string | null
          created_at?: string
          domain?: string | null
          engine?: string
          id?: string
          intern_number?: string
          is_active?: boolean | null
          model?: number
          picture?: string
          reason_for_termination?: string | null
          serie?: string | null
          status?: Database['public']['Enums']['status_type'] | null
          termination_date?: string | null
          type?: string
          type_of_vehicle?: number
          user_id?: string | null
          year?: string
        }
        Relationships: [
          {
            foreignKeyName: 'public_vehicles_model_fkey'
            columns: ['model']
            isOneToOne: false
            referencedRelation: 'model_vehicles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'public_vehicles_type_fkey'
            columns: ['type']
            isOneToOne: false
            referencedRelation: 'type'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'public_vehicles_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profile'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'vehicles_brand_fkey'
            columns: ['brand']
            isOneToOne: false
            referencedRelation: 'brand_vehicles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'vehicles_company_id_fkey'
            columns: ['company_id']
            isOneToOne: false
            referencedRelation: 'company'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'vehicles_type_of_vehicle_fkey'
            columns: ['type_of_vehicle']
            isOneToOne: false
            referencedRelation: 'types_of_vehicles'
            referencedColumns: ['id']
          },
        ]
      }
      'work-diagram': {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      actualizar_estado_documentos: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      enviar_correos_documentos_a_vencer: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      obtener_documentos_por_vencer: {
        Args: Record<PropertyKey, never>
        Returns: {
          tipo_documento: string
          correo_electronico: string
          fecha_vencimiento: string
          documento_empleado: string
          dominio_vehiculo: string
        }[]
      }
      verificar_documentos_vencidos_prueba: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      affiliate_status_enum: 'Dentro de convenio' | 'Fuera de convenio'
      document_applies: 'Persona' | 'Equipos'
      document_type_enum: 'DNI' | 'LE' | 'LC' | 'PASAPORTE'
      gender_enum: 'Masculino' | 'Femenino' | 'No Declarado'
      level_of_education_enum:
        | 'Primario'
        | 'Secundario'
        | 'Terciario'
        | 'Universitario'
        | 'PosGrado'
      marital_status_enum:
        | 'Casado'
        | 'Soltero'
        | 'Divorciado'
        | 'Viudo'
        | 'Separado'
      nationality_enum: 'Argentina' | 'Extranjero'
      notification_categories:
        | 'vencimiento'
        | 'noticia'
        | 'advertencia'
        | 'aprobado'
        | 'rechazado'
      reason_for_termination_enum:
        | 'Despido sin causa'
        | 'Renuncia'
        | 'Despido con causa'
        | 'Acuerdo de partes'
        | 'Fin de contrato'
      roles_enum: 'Externo' | 'Auditor'
      state: 'presentado' | 'rechazado' | 'aprobado' | 'vencido' | 'pendiente'
      status_type: 'Avalado' | 'No avalado'
      type_of_contract_enum:
        | 'Período de prueba'
        | 'A tiempo indeterminado'
        | 'Plazo fijo'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, 'public'>]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema['Tables'] & PublicSchema['Views'])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions['schema']]['Tables'] &
        Database[PublicTableNameOrOptions['schema']]['Views'])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions['schema']]['Tables'] &
      Database[PublicTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema['Tables'] &
        PublicSchema['Views'])
    ? (PublicSchema['Tables'] &
        PublicSchema['Views'])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema['Tables']
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions['schema']]['Tables']
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema['Tables']
    ? PublicSchema['Tables'][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema['Tables']
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions['schema']]['Tables']
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema['Tables']
    ? PublicSchema['Tables'][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema['Enums']
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions['schema']]['Enums'][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema['Enums']
    ? PublicSchema['Enums'][PublicEnumNameOrOptions]
    : never

    