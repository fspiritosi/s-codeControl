export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          operationName?: string
          query?: string
          variables?: Json
          extensions?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      assing_customer: {
        Row: {
          created_at: string
          customer_id: string
          employee_id: string
          equipment_id: string
          id: number
        }
        Insert: {
          created_at?: string
          customer_id: string
          employee_id: string
          equipment_id: string
          id?: number
        }
        Update: {
          created_at?: string
          customer_id?: string
          employee_id?: string
          equipment_id?: string
          id?: number
        }
        Relationships: [
          {
            foreignKeyName: "public_assing_customer_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "public_assing_customer_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_vehicles: {
        Row: {
          company_id: string | null
          created_at: string
          id: number
          is_active: boolean | null
          name: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          id?: number
          is_active?: boolean | null
          name?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string
          id?: number
          is_active?: boolean | null
          name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "brand_vehicles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company"
            referencedColumns: ["id"]
          },
        ]
      }
      category: {
        Row: {
          covenant_id: string | null
          created_at: string
          id: string
          is_active: boolean | null
          name: string | null
        }
        Insert: {
          covenant_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          name?: string | null
        }
        Update: {
          covenant_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "category_covenant_id_fkey"
            columns: ["covenant_id"]
            isOneToOne: false
            referencedRelation: "covenant"
            referencedColumns: ["id"]
          },
        ]
      }
      category_employee: {
        Row: {
          category_id: string | null
          created_at: string
          emplyee_id: string | null
          id: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          emplyee_id?: string | null
          id?: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          emplyee_id?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "public_covenant_category_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "category"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "public_covenant_employee_emplyee_id_fkey"
            columns: ["emplyee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
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
            foreignKeyName: "cities_province_id_fkey"
            columns: ["province_id"]
            isOneToOne: false
            referencedRelation: "provinces"
            referencedColumns: ["id"]
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
            foreignKeyName: "companies_employees_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "companies_employees_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
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
            foreignKeyName: "company_city_fkey"
            columns: ["city"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_province_id_fkey"
            columns: ["province_id"]
            isOneToOne: false
            referencedRelation: "provinces"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          company_id: string | null
          constact_email: string | null
          contact_charge: string | null
          contact_name: string | null
          contact_phone: number | null
          created_at: string
          customer_id: string | null
          id: string
          is_active: boolean | null
          reason_for_termination: string | null
          termination_date: string | null
        }
        Insert: {
          company_id?: string | null
          constact_email?: string | null
          contact_charge?: string | null
          contact_name?: string | null
          contact_phone?: number | null
          created_at?: string
          customer_id?: string | null
          id?: string
          is_active?: boolean | null
          reason_for_termination?: string | null
          termination_date?: string | null
        }
        Update: {
          company_id?: string | null
          constact_email?: string | null
          contact_charge?: string | null
          contact_name?: string | null
          contact_phone?: number | null
          created_at?: string
          customer_id?: string | null
          id?: string
          is_active?: boolean | null
          reason_for_termination?: string | null
          termination_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "public_contacts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "public_contacts_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
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
            foreignKeyName: "contractor_employee_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contractor_employee_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      contractor_equipment: {
        Row: {
          contractor_id: string | null
          created_at: string
          equipment_id: string | null
          id: string
        }
        Insert: {
          contractor_id?: string | null
          created_at?: string
          equipment_id?: string | null
          id?: string
        }
        Update: {
          contractor_id?: string | null
          created_at?: string
          equipment_id?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contractor_equipment_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contractor_equipment_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
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
      covenant: {
        Row: {
          company_id: string
          created_at: string
          guild_id: string
          id: string
          is_active: boolean | null
          name: string | null
        }
        Insert: {
          company_id: string
          created_at?: string
          guild_id: string
          id?: string
          is_active?: boolean | null
          name?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          guild_id?: string
          id?: string
          is_active?: boolean | null
          name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "covenant_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "covenant_guild_id_fkey"
            columns: ["guild_id"]
            isOneToOne: false
            referencedRelation: "guild"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_form: {
        Row: {
          company_id: string
          created_at: string
          form: Json
          id: string
          name: string
        }
        Insert: {
          company_id: string
          created_at?: string
          form: Json
          id?: string
          name: string
        }
        Update: {
          company_id?: string
          created_at?: string
          form?: Json
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "custom_form_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_services: {
        Row: {
          company_id: string | null
          created_at: string
          customer_id: string | null
          id: string
          is_active: boolean | null
          service_name: string | null
          service_start: string | null
          service_validity: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          customer_id?: string | null
          id?: string
          is_active?: boolean | null
          service_name?: string | null
          service_start?: string | null
          service_validity?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string
          customer_id?: string | null
          id?: string
          is_active?: boolean | null
          service_name?: string | null
          service_start?: string | null
          service_validity?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "public_customer_services_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "public_customer_services_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address: string | null
          client_email: string | null
          client_phone: number | null
          company_id: string
          created_at: string
          cuit: number
          id: string
          is_active: boolean | null
          name: string
          reason_for_termination: string | null
          termination_date: string | null
        }
        Insert: {
          address?: string | null
          client_email?: string | null
          client_phone?: number | null
          company_id: string
          created_at?: string
          cuit: number
          id?: string
          is_active?: boolean | null
          name: string
          reason_for_termination?: string | null
          termination_date?: string | null
        }
        Update: {
          address?: string | null
          client_email?: string | null
          client_phone?: number | null
          company_id?: string
          created_at?: string
          cuit?: number
          id?: string
          is_active?: boolean | null
          name?: string
          reason_for_termination?: string | null
          termination_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company"
            referencedColumns: ["id"]
          },
        ]
      }
      dailyreport: {
        Row: {
          company_id: string
          created_at: string | null
          creation_date: string | null
          date: string
          id: string
          is_active: boolean | null
          status: boolean | null
          updated_at: string | null
        }
        Insert: {
          company_id: string
          created_at?: string | null
          creation_date?: string | null
          date: string
          id?: string
          is_active?: boolean | null
          status?: boolean | null
          updated_at?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          creation_date?: string | null
          date?: string
          id?: string
          is_active?: boolean | null
          status?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "public_dailyreport_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company"
            referencedColumns: ["id"]
          },
        ]
      }
      dailyreportemployeerelations: {
        Row: {
          created_at: string | null
          daily_report_row_id: string | null
          employee_id: string | null
          id: string
        }
        Insert: {
          created_at?: string | null
          daily_report_row_id?: string | null
          employee_id?: string | null
          id?: string
        }
        Update: {
          created_at?: string | null
          daily_report_row_id?: string | null
          employee_id?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dailyreportemployeerelations_daily_report_row_id_fkey"
            columns: ["daily_report_row_id"]
            isOneToOne: false
            referencedRelation: "dailyreportrows"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dailyreportemployeerelations_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      dailyreportequipmentrelations: {
        Row: {
          created_at: string | null
          daily_report_row_id: string | null
          equipment_id: string | null
          id: string
        }
        Insert: {
          created_at?: string | null
          daily_report_row_id?: string | null
          equipment_id?: string | null
          id?: string
        }
        Update: {
          created_at?: string | null
          daily_report_row_id?: string | null
          equipment_id?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dailyreportequipmentrelations_daily_report_row_id_fkey"
            columns: ["daily_report_row_id"]
            isOneToOne: false
            referencedRelation: "dailyreportrows"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dailyreportequipmentrelations_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      dailyreportrows: {
        Row: {
          created_at: string | null
          customer_id: string | null
          daily_report_id: string | null
          description: string | null
          document_path: string | null
          end_time: string | null
          id: string
          item_id: string | null
          service_id: string | null
          start_time: string | null
          status: Database["public"]["Enums"]["daily_report_status"]
          updated_at: string | null
          working_day: string | null
        }
        Insert: {
          created_at?: string | null
          customer_id?: string | null
          daily_report_id?: string | null
          description?: string | null
          document_path?: string | null
          end_time?: string | null
          id?: string
          item_id?: string | null
          service_id?: string | null
          start_time?: string | null
          status?: Database["public"]["Enums"]["daily_report_status"]
          updated_at?: string | null
          working_day?: string | null
        }
        Update: {
          created_at?: string | null
          customer_id?: string | null
          daily_report_id?: string | null
          description?: string | null
          document_path?: string | null
          end_time?: string | null
          id?: string
          item_id?: string | null
          service_id?: string | null
          start_time?: string | null
          status?: Database["public"]["Enums"]["daily_report_status"]
          updated_at?: string | null
          working_day?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dailyreportrows_daily_report_id_fkey"
            columns: ["daily_report_id"]
            isOneToOne: false
            referencedRelation: "dailyreport"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "public_dailyreportrows_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "public_dailyreportrows_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "service_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "public_dailyreportrows_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "customer_services"
            referencedColumns: ["id"]
          },
        ]
      }
      diagram_type: {
        Row: {
          color: string
          company_id: string
          created_at: string
          id: string
          name: string | null
          short_description: string
          work_active: boolean | null
        }
        Insert: {
          color: string
          company_id?: string
          created_at?: string
          id?: string
          name?: string | null
          short_description: string
          work_active?: boolean | null
        }
        Update: {
          color?: string
          company_id?: string
          created_at?: string
          id?: string
          name?: string | null
          short_description?: string
          work_active?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "public_diagram_type_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company"
            referencedColumns: ["id"]
          },
        ]
      }
      diagrams_logs: {
        Row: {
          created_at: string
          description: string
          diagram_id: string
          employee_id: string
          id: string
          modified_by: string | null
          prev_date: string
          prev_state: string
          state: string
        }
        Insert: {
          created_at?: string
          description: string
          diagram_id: string
          employee_id: string
          id?: string
          modified_by?: string | null
          prev_date: string
          prev_state: string
          state: string
        }
        Update: {
          created_at?: string
          description?: string
          diagram_id?: string
          employee_id?: string
          id?: string
          modified_by?: string | null
          prev_date?: string
          prev_state?: string
          state?: string
        }
        Relationships: [
          {
            foreignKeyName: "diagrams_logs_diagram_id_fkey"
            columns: ["diagram_id"]
            isOneToOne: false
            referencedRelation: "diagram_type"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diagrams_logs_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diagrams_logs_modified_by_fkey"
            columns: ["modified_by"]
            isOneToOne: false
            referencedRelation: "profile"
            referencedColumns: ["id"]
          },
        ]
      }
      document_types: {
        Row: {
          applies: Database["public"]["Enums"]["document_applies"]
          company_id: string | null
          created_at: string
          description: string | null
          down_document: boolean | null
          explired: boolean
          id: string
          is_active: boolean
          is_it_montlhy: boolean | null
          mandatory: boolean
          multiresource: boolean
          name: string
          private: boolean | null
          special: boolean
        }
        Insert: {
          applies: Database["public"]["Enums"]["document_applies"]
          company_id?: string | null
          created_at?: string
          description?: string | null
          down_document?: boolean | null
          explired: boolean
          id?: string
          is_active?: boolean
          is_it_montlhy?: boolean | null
          mandatory: boolean
          multiresource: boolean
          name: string
          private?: boolean | null
          special: boolean
        }
        Update: {
          applies?: Database["public"]["Enums"]["document_applies"]
          company_id?: string | null
          created_at?: string
          description?: string | null
          down_document?: boolean | null
          explired?: boolean
          id?: string
          is_active?: boolean
          is_it_montlhy?: boolean | null
          mandatory?: boolean
          multiresource?: boolean
          name?: string
          private?: boolean | null
          special?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "document_types_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company"
            referencedColumns: ["id"]
          },
        ]
      }
      documents_company: {
        Row: {
          applies: string
          created_at: string
          deny_reason: string | null
          document_path: string | null
          id: string
          id_document_types: string | null
          is_active: boolean | null
          period: string | null
          state: Database["public"]["Enums"]["state"]
          user_id: string | null
          validity: string | null
        }
        Insert: {
          applies: string
          created_at?: string
          deny_reason?: string | null
          document_path?: string | null
          id?: string
          id_document_types?: string | null
          is_active?: boolean | null
          period?: string | null
          state?: Database["public"]["Enums"]["state"]
          user_id?: string | null
          validity?: string | null
        }
        Update: {
          applies?: string
          created_at?: string
          deny_reason?: string | null
          document_path?: string | null
          id?: string
          id_document_types?: string | null
          is_active?: boolean | null
          period?: string | null
          state?: Database["public"]["Enums"]["state"]
          user_id?: string | null
          validity?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_company_applies_fkey"
            columns: ["applies"]
            isOneToOne: false
            referencedRelation: "company"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_company_id_document_types_fkey"
            columns: ["id_document_types"]
            isOneToOne: false
            referencedRelation: "document_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_company_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profile"
            referencedColumns: ["id"]
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
          period: string | null
          state: Database["public"]["Enums"]["state"]
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
          period?: string | null
          state?: Database["public"]["Enums"]["state"]
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
          period?: string | null
          state?: Database["public"]["Enums"]["state"]
          user_id?: string | null
          validity?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_employees_applies_fkey"
            columns: ["applies"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_employees_id_document_types_fkey"
            columns: ["id_document_types"]
            isOneToOne: false
            referencedRelation: "document_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_employees_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profile"
            referencedColumns: ["id"]
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
            foreignKeyName: "public_documents_employees_logs_documents_employees_id_fkey"
            columns: ["documents_employees_id"]
            isOneToOne: false
            referencedRelation: "documents_employees"
            referencedColumns: ["id"]
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
          period: string | null
          state: Database["public"]["Enums"]["state"] | null
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
          period?: string | null
          state?: Database["public"]["Enums"]["state"] | null
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
          period?: string | null
          state?: Database["public"]["Enums"]["state"] | null
          user_id?: string | null
          validity?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_equipment_applies_fkey"
            columns: ["applies"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_equipment_id_document_types_fkey"
            columns: ["id_document_types"]
            isOneToOne: false
            referencedRelation: "document_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_equipment_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profile"
            referencedColumns: ["id"]
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
            foreignKeyName: "public_documents_equipment_logs_documents_equipment_id_fkey"
            columns: ["documents_equipment_id"]
            isOneToOne: false
            referencedRelation: "documents_equipment"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          affiliate_status:
            | Database["public"]["Enums"]["affiliate_status_enum"]
            | null
          allocated_to: string[] | null
          birthplace: string
          category_id: string | null
          city: number
          company_id: string | null
          company_position: string | null
          covenants_id: string | null
          created_at: string
          cuil: string
          date_of_admission: string
          document_number: string
          document_type: Database["public"]["Enums"]["document_type_enum"]
          email: string | null
          file: string
          firstname: string
          gender: Database["public"]["Enums"]["gender_enum"] | null
          guild_id: string | null
          hierarchical_position: string | null
          id: string
          is_active: boolean | null
          lastname: string
          level_of_education:
            | Database["public"]["Enums"]["level_of_education_enum"]
            | null
          marital_status:
            | Database["public"]["Enums"]["marital_status_enum"]
            | null
          nationality: Database["public"]["Enums"]["nationality_enum"]
          normal_hours: string | null
          phone: string
          picture: string
          postal_code: string | null
          province: number
          reason_for_termination:
            | Database["public"]["Enums"]["reason_for_termination_enum"]
            | null
          status: Database["public"]["Enums"]["status_type"] | null
          street: string
          street_number: string
          termination_date: string | null
          type_of_contract: Database["public"]["Enums"]["type_of_contract_enum"]
          workflow_diagram: string | null
        }
        Insert: {
          affiliate_status?:
            | Database["public"]["Enums"]["affiliate_status_enum"]
            | null
          allocated_to?: string[] | null
          birthplace: string
          category_id?: string | null
          city: number
          company_id?: string | null
          company_position?: string | null
          covenants_id?: string | null
          created_at?: string
          cuil: string
          date_of_admission: string
          document_number: string
          document_type: Database["public"]["Enums"]["document_type_enum"]
          email?: string | null
          file: string
          firstname: string
          gender?: Database["public"]["Enums"]["gender_enum"] | null
          guild_id?: string | null
          hierarchical_position?: string | null
          id?: string
          is_active?: boolean | null
          lastname: string
          level_of_education?:
            | Database["public"]["Enums"]["level_of_education_enum"]
            | null
          marital_status?:
            | Database["public"]["Enums"]["marital_status_enum"]
            | null
          nationality: Database["public"]["Enums"]["nationality_enum"]
          normal_hours?: string | null
          phone: string
          picture: string
          postal_code?: string | null
          province: number
          reason_for_termination?:
            | Database["public"]["Enums"]["reason_for_termination_enum"]
            | null
          status?: Database["public"]["Enums"]["status_type"] | null
          street: string
          street_number: string
          termination_date?: string | null
          type_of_contract: Database["public"]["Enums"]["type_of_contract_enum"]
          workflow_diagram?: string | null
        }
        Update: {
          affiliate_status?:
            | Database["public"]["Enums"]["affiliate_status_enum"]
            | null
          allocated_to?: string[] | null
          birthplace?: string
          category_id?: string | null
          city?: number
          company_id?: string | null
          company_position?: string | null
          covenants_id?: string | null
          created_at?: string
          cuil?: string
          date_of_admission?: string
          document_number?: string
          document_type?: Database["public"]["Enums"]["document_type_enum"]
          email?: string | null
          file?: string
          firstname?: string
          gender?: Database["public"]["Enums"]["gender_enum"] | null
          guild_id?: string | null
          hierarchical_position?: string | null
          id?: string
          is_active?: boolean | null
          lastname?: string
          level_of_education?:
            | Database["public"]["Enums"]["level_of_education_enum"]
            | null
          marital_status?:
            | Database["public"]["Enums"]["marital_status_enum"]
            | null
          nationality?: Database["public"]["Enums"]["nationality_enum"]
          normal_hours?: string | null
          phone?: string
          picture?: string
          postal_code?: string | null
          province?: number
          reason_for_termination?:
            | Database["public"]["Enums"]["reason_for_termination_enum"]
            | null
          status?: Database["public"]["Enums"]["status_type"] | null
          street?: string
          street_number?: string
          termination_date?: string | null
          type_of_contract?: Database["public"]["Enums"]["type_of_contract_enum"]
          workflow_diagram?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employees_birthplace_fkey"
            columns: ["birthplace"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "category"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_city_fkey"
            columns: ["city"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_covenants_id_fkey"
            columns: ["covenants_id"]
            isOneToOne: false
            referencedRelation: "covenant"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_guild_id_fkey"
            columns: ["guild_id"]
            isOneToOne: false
            referencedRelation: "guild"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_hierarchical_position_fkey"
            columns: ["hierarchical_position"]
            isOneToOne: false
            referencedRelation: "hierarchy"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_province_fkey"
            columns: ["province"]
            isOneToOne: false
            referencedRelation: "provinces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_workflow_diagram_fkey"
            columns: ["workflow_diagram"]
            isOneToOne: false
            referencedRelation: "work-diagram"
            referencedColumns: ["id"]
          },
        ]
      }
      employees_diagram: {
        Row: {
          created_at: string
          day: number
          diagram_type: string
          employee_id: string
          id: string
          month: number
          year: number
        }
        Insert: {
          created_at?: string
          day: number
          diagram_type?: string
          employee_id?: string
          id?: string
          month: number
          year: number
        }
        Update: {
          created_at?: string
          day?: number
          diagram_type?: string
          employee_id?: string
          id?: string
          month?: number
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "public_employees_diagram_diagram_type_fkey"
            columns: ["diagram_type"]
            isOneToOne: false
            referencedRelation: "diagram_type"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "public_employees_diagram_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      form_answers: {
        Row: {
          answer: Json
          created_at: string
          form_id: string
          id: string
        }
        Insert: {
          answer: Json
          created_at?: string
          form_id: string
          id?: string
        }
        Update: {
          answer?: Json
          created_at?: string
          form_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "form_answers_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "custom_form"
            referencedColumns: ["id"]
          },
        ]
      }
      guild: {
        Row: {
          company_id: string | null
          created_at: string
          id: string
          is_active: boolean
          name: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "public_guild_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company"
            referencedColumns: ["id"]
          },
        ]
      }
      handle_errors: {
        Row: {
          created_at: string
          id: number
          menssage: string
          path: string
        }
        Insert: {
          created_at?: string
          id?: number
          menssage: string
          path: string
        }
        Update: {
          created_at?: string
          id?: number
          menssage?: string
          path?: string
        }
        Relationships: []
      }
      hierarchy: {
        Row: {
          created_at: string
          id: string
          is_active: boolean | null
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          name?: string
        }
        Relationships: []
      }
      hired_modules: {
        Row: {
          company_id: string | null
          created_at: string
          due_to: string | null
          id: string
          module_id: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          due_to?: string | null
          id?: string
          module_id?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string
          due_to?: string | null
          id?: string
          module_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hired_modules_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hired_modules_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      industry_type: {
        Row: {
          created_at: string
          id: number
          is_active: boolean | null
          name: string | null
        }
        Insert: {
          created_at?: string
          id?: number
          is_active?: boolean | null
          name?: string | null
        }
        Update: {
          created_at?: string
          id?: number
          is_active?: boolean | null
          name?: string | null
        }
        Relationships: []
      }
      measure_units: {
        Row: {
          id: number
          simbol: string
          tipo: string
          unit: string
        }
        Insert: {
          id?: number
          simbol: string
          tipo: string
          unit: string
        }
        Update: {
          id?: number
          simbol?: string
          tipo?: string
          unit?: string
        }
        Relationships: []
      }
      model_vehicles: {
        Row: {
          brand: number | null
          created_at: string
          id: number
          is_active: boolean | null
          name: string | null
        }
        Insert: {
          brand?: number | null
          created_at?: string
          id?: number
          is_active?: boolean | null
          name?: string | null
        }
        Update: {
          brand?: number | null
          created_at?: string
          id?: number
          is_active?: boolean | null
          name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "public_model_vehicles_brand_fkey"
            columns: ["brand"]
            isOneToOne: false
            referencedRelation: "brand_vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      modules: {
        Row: {
          created_at: string
          description: string
          id: string
          name: string
          price: number
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          name: string
          price: number
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          name?: string
          price?: number
        }
        Relationships: []
      }
      notifications: {
        Row: {
          category:
            | Database["public"]["Enums"]["notification_categories"]
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
            | Database["public"]["Enums"]["notification_categories"]
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
            | Database["public"]["Enums"]["notification_categories"]
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
            foreignKeyName: "public_notifications_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company"
            referencedColumns: ["id"]
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
          modulos: Database["public"]["Enums"]["modulos"][] | null
          role: string | null
        }
        Insert: {
          avatar?: string | null
          created_at?: string | null
          credential_id?: string | null
          email?: string | null
          fullname?: string | null
          id: string
          modulos?: Database["public"]["Enums"]["modulos"][] | null
          role?: string | null
        }
        Update: {
          avatar?: string | null
          created_at?: string | null
          credential_id?: string | null
          email?: string | null
          fullname?: string | null
          id?: string
          modulos?: Database["public"]["Enums"]["modulos"][] | null
          role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profile_credential_id_fkey"
            columns: ["credential_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_role_fkey"
            columns: ["role"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["name"]
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
      repair_solicitudes: {
        Row: {
          created_at: string
          employee_id: string | null
          end_date: string | null
          equipment_id: string
          id: string
          kilometer: string | null
          mechanic_description: string | null
          mechanic_id: string | null
          mechanic_images: string[] | null
          reparation_type: string
          scheduled: string | null
          state: Database["public"]["Enums"]["repair_state"]
          user_description: string | null
          user_id: string | null
          user_images: string[] | null
        }
        Insert: {
          created_at?: string
          employee_id?: string | null
          end_date?: string | null
          equipment_id: string
          id?: string
          kilometer?: string | null
          mechanic_description?: string | null
          mechanic_id?: string | null
          mechanic_images?: string[] | null
          reparation_type: string
          scheduled?: string | null
          state: Database["public"]["Enums"]["repair_state"]
          user_description?: string | null
          user_id?: string | null
          user_images?: string[] | null
        }
        Update: {
          created_at?: string
          employee_id?: string | null
          end_date?: string | null
          equipment_id?: string
          id?: string
          kilometer?: string | null
          mechanic_description?: string | null
          mechanic_id?: string | null
          mechanic_images?: string[] | null
          reparation_type?: string
          scheduled?: string | null
          state?: Database["public"]["Enums"]["repair_state"]
          user_description?: string | null
          user_id?: string | null
          user_images?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "repair_solicitudes_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "repair_solicitudes_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "repair_solicitudes_mechanic_id_fkey"
            columns: ["mechanic_id"]
            isOneToOne: false
            referencedRelation: "profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "repair_solicitudes_reparation_type_fkey"
            columns: ["reparation_type"]
            isOneToOne: false
            referencedRelation: "types_of_repairs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "repair_solicitudes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profile"
            referencedColumns: ["id"]
          },
        ]
      }
      repairlogs: {
        Row: {
          created_at: string
          description: string | null
          id: string
          kilometer: string | null
          modified_by_employee: string | null
          modified_by_user: string | null
          repair_id: string | null
          title: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          kilometer?: string | null
          modified_by_employee?: string | null
          modified_by_user?: string | null
          repair_id?: string | null
          title?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          kilometer?: string | null
          modified_by_employee?: string | null
          modified_by_user?: string | null
          repair_id?: string | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "repairlogs_modified_by_employee_fkey"
            columns: ["modified_by_employee"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "repairlogs_modified_by_user_fkey"
            columns: ["modified_by_user"]
            isOneToOne: false
            referencedRelation: "profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reparirlogs_repair_id_fkey"
            columns: ["repair_id"]
            isOneToOne: false
            referencedRelation: "repair_solicitudes"
            referencedColumns: ["id"]
          },
        ]
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
      service_items: {
        Row: {
          company_id: string
          created_at: string
          customer_service_id: string
          id: string
          is_active: boolean | null
          item_description: string
          item_measure_units: number
          item_name: string
          item_price: number
        }
        Insert: {
          company_id: string
          created_at?: string
          customer_service_id: string
          id?: string
          is_active?: boolean | null
          item_description: string
          item_measure_units: number
          item_name: string
          item_price: number
        }
        Update: {
          company_id?: string
          created_at?: string
          customer_service_id?: string
          id?: string
          is_active?: boolean | null
          item_description?: string
          item_measure_units?: number
          item_name?: string
          item_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "public_service_items_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "public_service_items_costumer_service_id_fkey"
            columns: ["customer_service_id"]
            isOneToOne: false
            referencedRelation: "customer_services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "public_service_items_item_measure_units_fkey"
            columns: ["item_measure_units"]
            isOneToOne: false
            referencedRelation: "measure_units"
            referencedColumns: ["id"]
          },
        ]
      }
      share_company_users: {
        Row: {
          company_id: string | null
          created_at: string
          customer_id: string | null
          id: string
          modules: Database["public"]["Enums"]["modulos"][] | null
          profile_id: string | null
          role: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          customer_id?: string | null
          id?: string
          modules?: Database["public"]["Enums"]["modulos"][] | null
          profile_id?: string | null
          role?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string
          customer_id?: string | null
          id?: string
          modules?: Database["public"]["Enums"]["modulos"][] | null
          profile_id?: string | null
          role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "public_share_company_users_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "public_share_company_users_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "share_company_users_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "share_company_users_role_fkey"
            columns: ["role"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["name"]
          },
        ]
      }
      storage_migrations: {
        Row: {
          created_at: string | null
          document_id: string
          error_message: string | null
          executed_at: string | null
          id: string
          new_path: string
          old_path: string
          status: string | null
        }
        Insert: {
          created_at?: string | null
          document_id: string
          error_message?: string | null
          executed_at?: string | null
          id?: string
          new_path: string
          old_path: string
          status?: string | null
        }
        Update: {
          created_at?: string | null
          document_id?: string
          error_message?: string | null
          executed_at?: string | null
          id?: string
          new_path?: string
          old_path?: string
          status?: string | null
        }
        Relationships: []
      }
      type: {
        Row: {
          company_id: string | null
          created_at: string
          id: string
          is_active: boolean | null
          name: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          name: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "type_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company"
            referencedColumns: ["id"]
          },
        ]
      }
      types_of_repairs: {
        Row: {
          company_id: string | null
          created_at: string
          criticity: string | null
          description: string
          id: string
          is_active: boolean
          multi_equipment: boolean
          name: string
          qr_close: boolean
          type_of_maintenance:
            | Database["public"]["Enums"]["type_of_maintenance_ENUM"]
            | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          criticity?: string | null
          description: string
          id?: string
          is_active?: boolean
          multi_equipment?: boolean
          name: string
          qr_close?: boolean
          type_of_maintenance?:
            | Database["public"]["Enums"]["type_of_maintenance_ENUM"]
            | null
        }
        Update: {
          company_id?: string | null
          created_at?: string
          criticity?: string | null
          description?: string
          id?: string
          is_active?: boolean
          multi_equipment?: boolean
          name?: string
          qr_close?: boolean
          type_of_maintenance?:
            | Database["public"]["Enums"]["type_of_maintenance_ENUM"]
            | null
        }
        Relationships: [
          {
            foreignKeyName: "types_of_repairs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company"
            referencedColumns: ["id"]
          },
        ]
      }
      types_of_vehicles: {
        Row: {
          created_at: string
          id: number
          is_active: boolean | null
          name: string | null
        }
        Insert: {
          created_at?: string
          id?: number
          is_active?: boolean | null
          name?: string | null
        }
        Update: {
          created_at?: string
          id?: number
          is_active?: boolean | null
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
          condition: Database["public"]["Enums"]["condition_enum"] | null
          created_at: string
          domain: string | null
          engine: string
          id: string
          intern_number: string
          is_active: boolean | null
          kilometer: string | null
          model: number
          picture: string
          reason_for_termination: string | null
          serie: string | null
          status: Database["public"]["Enums"]["status_type"] | null
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
          company_id?: string | null
          condition?: Database["public"]["Enums"]["condition_enum"] | null
          created_at?: string
          domain?: string | null
          engine: string
          id?: string
          intern_number: string
          is_active?: boolean | null
          kilometer?: string | null
          model: number
          picture: string
          reason_for_termination?: string | null
          serie?: string | null
          status?: Database["public"]["Enums"]["status_type"] | null
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
          condition?: Database["public"]["Enums"]["condition_enum"] | null
          created_at?: string
          domain?: string | null
          engine?: string
          id?: string
          intern_number?: string
          is_active?: boolean | null
          kilometer?: string | null
          model?: number
          picture?: string
          reason_for_termination?: string | null
          serie?: string | null
          status?: Database["public"]["Enums"]["status_type"] | null
          termination_date?: string | null
          type?: string
          type_of_vehicle?: number
          user_id?: string | null
          year?: string
        }
        Relationships: [
          {
            foreignKeyName: "public_vehicles_model_fkey"
            columns: ["model"]
            isOneToOne: false
            referencedRelation: "model_vehicles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "public_vehicles_type_fkey"
            columns: ["type"]
            isOneToOne: false
            referencedRelation: "type"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicles_brand_fkey"
            columns: ["brand"]
            isOneToOne: false
            referencedRelation: "brand_vehicles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicles_type_of_vehicle_fkey"
            columns: ["type_of_vehicle"]
            isOneToOne: false
            referencedRelation: "types_of_vehicles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profile"
            referencedColumns: ["id"]
          },
        ]
      }
      "work-diagram": {
        Row: {
          created_at: string
          id: string
          is_active: boolean | null
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean | null
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
      delete_expired_subscriptions: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      enviar_documentos_a_46_dias: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      enviar_documentos_vencidos: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      find_employee_by_full_name_v2: {
        Args: {
          p_full_name: string
          p_company_id: string
        }
        Returns: {
          affiliate_status:
            | Database["public"]["Enums"]["affiliate_status_enum"]
            | null
          allocated_to: string[] | null
          birthplace: string
          category_id: string | null
          city: number
          company_id: string | null
          company_position: string | null
          covenants_id: string | null
          created_at: string
          cuil: string
          date_of_admission: string
          document_number: string
          document_type: Database["public"]["Enums"]["document_type_enum"]
          email: string | null
          file: string
          firstname: string
          gender: Database["public"]["Enums"]["gender_enum"] | null
          guild_id: string | null
          hierarchical_position: string | null
          id: string
          is_active: boolean | null
          lastname: string
          level_of_education:
            | Database["public"]["Enums"]["level_of_education_enum"]
            | null
          marital_status:
            | Database["public"]["Enums"]["marital_status_enum"]
            | null
          nationality: Database["public"]["Enums"]["nationality_enum"]
          normal_hours: string | null
          phone: string
          picture: string
          postal_code: string | null
          province: number
          reason_for_termination:
            | Database["public"]["Enums"]["reason_for_termination_enum"]
            | null
          status: Database["public"]["Enums"]["status_type"] | null
          street: string
          street_number: string
          termination_date: string | null
          type_of_contract: Database["public"]["Enums"]["type_of_contract_enum"]
          workflow_diagram: string | null
        }[]
      }
      migrate_document: {
        Args: {
          target_id: string
          execute_migration?: boolean
        }
        Returns: {
          old_path: string
          new_path: string
          success: boolean
          error_message: string
          action_taken: string
          storage_migration_id: string
        }[]
      }
      migrate_documents_preview: {
        Args: Record<PropertyKey, never>
        Returns: {
          old_path: string
          new_path: string
          success: boolean
          error_message: string
        }[]
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
      pruebaemail: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      verificar_documentos_vencidos_prueba: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      affiliate_status_enum: "Dentro de convenio" | "Fuera de convenio"
      condition_enum:
        | "operativo"
        | "no operativo"
        | "en reparación"
        | "operativo condicionado"
      daily_report_status:
        | "pendiente"
        | "ejecutado"
        | "reprogramado"
        | "cancelado"
      document_applies: "Persona" | "Equipos" | "Empresa"
      document_type_enum: "DNI" | "LE" | "LC" | "PASAPORTE"
      gender_enum: "Masculino" | "Femenino" | "No Declarado"
      level_of_education_enum:
        | "Primario"
        | "Secundario"
        | "Terciario"
        | "Universitario"
        | "PosGrado"
      marital_status_enum:
        | "Casado"
        | "Soltero"
        | "Divorciado"
        | "Viudo"
        | "Separado"
      modulos:
        | "empresa"
        | "empleados"
        | "equipos"
        | "documentación"
        | "mantenimiento"
        | "dashboard"
        | "ayuda"
        | "operaciones"
        | "formularios"
      nationality_enum: "Argentina" | "Extranjero"
      notification_categories:
        | "vencimiento"
        | "noticia"
        | "advertencia"
        | "aprobado"
        | "rechazado"
      reason_for_termination_enum:
        | "Despido sin causa"
        | "Renuncia"
        | "Despido con causa"
        | "Acuerdo de partes"
        | "Fin de contrato"
        | "Fallecimiento"
      repair_state:
        | "Pendiente"
        | "Esperando repuestos"
        | "En reparación"
        | "Finalizado"
        | "Rechazado"
        | "Cancelado"
        | "Programado"
      roles_enum: "Externo" | "Auditor"
      state: "presentado" | "rechazado" | "aprobado" | "vencido" | "pendiente"
      status_type:
        | "Avalado"
        | "No avalado"
        | "Incompleto"
        | "Completo"
        | "Completo con doc vencida"
      type_of_contract_enum:
        | "Período de prueba"
        | "A tiempo indeterminado"
        | "Plazo fijo"
      type_of_maintenance_ENUM: "Correctivo" | "Preventivo"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

