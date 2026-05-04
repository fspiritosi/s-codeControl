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
      bank_accounts: {
        Row: {
          account_number: string
          account_type: Database["public"]["Enums"]["bank_account_type"]
          alias: string | null
          balance: number
          bank_name: string
          cbu: string | null
          company_id: string
          created_at: string
          created_by: string | null
          currency: string
          id: string
          status: Database["public"]["Enums"]["bank_account_status"]
          updated_at: string
        }
        Insert: {
          account_number: string
          account_type: Database["public"]["Enums"]["bank_account_type"]
          alias?: string | null
          balance?: number
          bank_name: string
          cbu?: string | null
          company_id: string
          created_at?: string
          created_by?: string | null
          currency?: string
          id?: string
          status?: Database["public"]["Enums"]["bank_account_status"]
          updated_at?: string
        }
        Update: {
          account_number?: string
          account_type?: Database["public"]["Enums"]["bank_account_type"]
          alias?: string | null
          balance?: number
          bank_name?: string
          cbu?: string | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          currency?: string
          id?: string
          status?: Database["public"]["Enums"]["bank_account_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bank_accounts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_movements: {
        Row: {
          amount: number
          bank_account_id: string
          company_id: string
          created_at: string
          created_by: string
          date: string
          description: string
          id: string
          payment_order_id: string | null
          reconciled: boolean
          reconciled_at: string | null
          reconciled_by: string | null
          reference: string | null
          reference_id: string | null
          reference_type: string | null
          statement_number: string | null
          type: Database["public"]["Enums"]["bank_movement_type"]
          updated_at: string
        }
        Insert: {
          amount: number
          bank_account_id: string
          company_id: string
          created_at?: string
          created_by: string
          date: string
          description: string
          id?: string
          payment_order_id?: string | null
          reconciled?: boolean
          reconciled_at?: string | null
          reconciled_by?: string | null
          reference?: string | null
          reference_id?: string | null
          reference_type?: string | null
          statement_number?: string | null
          type: Database["public"]["Enums"]["bank_movement_type"]
          updated_at?: string
        }
        Update: {
          amount?: number
          bank_account_id?: string
          company_id?: string
          created_at?: string
          created_by?: string
          date?: string
          description?: string
          id?: string
          payment_order_id?: string | null
          reconciled?: boolean
          reconciled_at?: string | null
          reconciled_by?: string | null
          reference?: string | null
          reference_id?: string | null
          reference_type?: string | null
          statement_number?: string | null
          type?: Database["public"]["Enums"]["bank_movement_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bank_movements_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_movements_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_movements_payment_order_id_fkey"
            columns: ["payment_order_id"]
            isOneToOne: false
            referencedRelation: "payment_orders"
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
      cash_movements: {
        Row: {
          amount: number
          cash_register_id: string
          company_id: string
          created_at: string
          created_by: string
          date: string
          description: string
          id: string
          purchase_invoice_id: string | null
          reference: string | null
          session_id: string
          type: Database["public"]["Enums"]["cash_movement_type"]
          updated_at: string
        }
        Insert: {
          amount: number
          cash_register_id: string
          company_id: string
          created_at?: string
          created_by: string
          date?: string
          description: string
          id?: string
          purchase_invoice_id?: string | null
          reference?: string | null
          session_id: string
          type: Database["public"]["Enums"]["cash_movement_type"]
          updated_at?: string
        }
        Update: {
          amount?: number
          cash_register_id?: string
          company_id?: string
          created_at?: string
          created_by?: string
          date?: string
          description?: string
          id?: string
          purchase_invoice_id?: string | null
          reference?: string | null
          session_id?: string
          type?: Database["public"]["Enums"]["cash_movement_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cash_movements_cash_register_id_fkey"
            columns: ["cash_register_id"]
            isOneToOne: false
            referencedRelation: "cash_registers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_movements_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_movements_purchase_invoice_id_fkey"
            columns: ["purchase_invoice_id"]
            isOneToOne: false
            referencedRelation: "purchase_invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_movements_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "cash_register_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      cash_register_sessions: {
        Row: {
          actual_balance: number | null
          cash_register_id: string
          closed_at: string | null
          closed_by: string | null
          closing_notes: string | null
          company_id: string
          created_at: string
          difference: number | null
          expected_balance: number
          id: string
          opened_at: string
          opened_by: string
          opening_balance: number
          opening_notes: string | null
          session_number: number
          status: Database["public"]["Enums"]["session_status"]
          updated_at: string
        }
        Insert: {
          actual_balance?: number | null
          cash_register_id: string
          closed_at?: string | null
          closed_by?: string | null
          closing_notes?: string | null
          company_id: string
          created_at?: string
          difference?: number | null
          expected_balance?: number
          id?: string
          opened_at?: string
          opened_by: string
          opening_balance?: number
          opening_notes?: string | null
          session_number: number
          status?: Database["public"]["Enums"]["session_status"]
          updated_at?: string
        }
        Update: {
          actual_balance?: number | null
          cash_register_id?: string
          closed_at?: string | null
          closed_by?: string | null
          closing_notes?: string | null
          company_id?: string
          created_at?: string
          difference?: number | null
          expected_balance?: number
          id?: string
          opened_at?: string
          opened_by?: string
          opening_balance?: number
          opening_notes?: string | null
          session_number?: number
          status?: Database["public"]["Enums"]["session_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cash_register_sessions_cash_register_id_fkey"
            columns: ["cash_register_id"]
            isOneToOne: false
            referencedRelation: "cash_registers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_register_sessions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company"
            referencedColumns: ["id"]
          },
        ]
      }
      cash_registers: {
        Row: {
          code: string
          company_id: string
          created_at: string
          created_by: string | null
          id: string
          is_default: boolean
          location: string | null
          name: string
          status: Database["public"]["Enums"]["cash_register_status"]
          updated_at: string
        }
        Insert: {
          code: string
          company_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_default?: boolean
          location?: string | null
          name: string
          status?: Database["public"]["Enums"]["cash_register_status"]
          updated_at?: string
        }
        Update: {
          code?: string
          company_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_default?: boolean
          location?: string | null
          name?: string
          status?: Database["public"]["Enums"]["cash_register_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cash_registers_company_id_fkey"
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
      checks: {
        Row: {
          account_number: string | null
          amount: number
          bank_account_id: string | null
          bank_movement_id: string | null
          bank_name: string
          branch: string | null
          check_number: string
          cleared_at: string | null
          company_id: string
          created_at: string
          created_by: string
          customer_id: string | null
          deposited_at: string | null
          drawer_name: string
          drawer_tax_id: string | null
          due_date: string
          endorsed_at: string | null
          endorsed_to_name: string | null
          endorsed_to_tax_id: string | null
          id: string
          issue_date: string
          notes: string | null
          payee_name: string | null
          payment_order_payment_id: string | null
          rejected_at: string | null
          rejection_reason: string | null
          status: Database["public"]["Enums"]["check_status"]
          supplier_id: string | null
          type: Database["public"]["Enums"]["check_type"]
          updated_at: string
        }
        Insert: {
          account_number?: string | null
          amount: number
          bank_account_id?: string | null
          bank_movement_id?: string | null
          bank_name: string
          branch?: string | null
          check_number: string
          cleared_at?: string | null
          company_id: string
          created_at?: string
          created_by: string
          customer_id?: string | null
          deposited_at?: string | null
          drawer_name: string
          drawer_tax_id?: string | null
          due_date: string
          endorsed_at?: string | null
          endorsed_to_name?: string | null
          endorsed_to_tax_id?: string | null
          id?: string
          issue_date: string
          notes?: string | null
          payee_name?: string | null
          payment_order_payment_id?: string | null
          rejected_at?: string | null
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["check_status"]
          supplier_id?: string | null
          type: Database["public"]["Enums"]["check_type"]
          updated_at?: string
        }
        Update: {
          account_number?: string | null
          amount?: number
          bank_account_id?: string | null
          bank_movement_id?: string | null
          bank_name?: string
          branch?: string | null
          check_number?: string
          cleared_at?: string | null
          company_id?: string
          created_at?: string
          created_by?: string
          customer_id?: string | null
          deposited_at?: string | null
          drawer_name?: string
          drawer_tax_id?: string | null
          due_date?: string
          endorsed_at?: string | null
          endorsed_to_name?: string | null
          endorsed_to_tax_id?: string | null
          id?: string
          issue_date?: string
          notes?: string | null
          payee_name?: string | null
          payment_order_payment_id?: string | null
          rejected_at?: string | null
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["check_status"]
          supplier_id?: string | null
          type?: Database["public"]["Enums"]["check_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "checks_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checks_bank_movement_id_fkey"
            columns: ["bank_movement_id"]
            isOneToOne: true
            referencedRelation: "bank_movements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checks_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checks_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checks_payment_order_payment_id_fkey"
            columns: ["payment_order_payment_id"]
            isOneToOne: true
            referencedRelation: "payment_order_payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checks_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
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
          company_group_id: string | null
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
          company_group_id?: string | null
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
          company_group_id?: string | null
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
            foreignKeyName: "company_company_group_id_fkey"
            columns: ["company_group_id"]
            isOneToOne: false
            referencedRelation: "company_groups"
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
      company_groups: {
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
          conditions: Json[] | null
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
          conditions?: Json[] | null
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
          conditions?: Json[] | null
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
          born_date: string | null
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
          type_of_contract: string
          workflow_diagram: string | null
        }
        Insert: {
          affiliate_status?:
            | Database["public"]["Enums"]["affiliate_status_enum"]
            | null
          allocated_to?: string[] | null
          birthplace: string
          born_date?: string | null
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
          type_of_contract: string
          workflow_diagram?: string | null
        }
        Update: {
          affiliate_status?:
            | Database["public"]["Enums"]["affiliate_status_enum"]
            | null
          allocated_to?: string[] | null
          birthplace?: string
          born_date?: string | null
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
          type_of_contract?: string
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
            foreignKeyName: "hierarchy_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company"
            referencedColumns: ["id"]
          },
        ]
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
      hse_doc_types: {
        Row: {
          company_id: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string | null
          short_description: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string | null
          short_description?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string | null
          short_description?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hse_doc_types_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company"
            referencedColumns: ["id"]
          },
        ]
      }
      hse_document_assignment_versions: {
        Row: {
          accepted_at: string | null
          assignee_id: string
          assignment_id: string
          created_at: string
          declined_at: string | null
          declined_reason: string | null
          document_version_id: string
          id: string
          status: string
        }
        Insert: {
          accepted_at?: string | null
          assignee_id: string
          assignment_id: string
          created_at?: string
          declined_at?: string | null
          declined_reason?: string | null
          document_version_id: string
          id?: string
          status?: string
        }
        Update: {
          accepted_at?: string | null
          assignee_id?: string
          assignment_id?: string
          created_at?: string
          declined_at?: string | null
          declined_reason?: string | null
          document_version_id?: string
          id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "hse_document_assignment_versions_assignee_id_fkey"
            columns: ["assignee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hse_document_assignment_versions_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "hse_document_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hse_document_assignment_versions_document_version_id_fkey"
            columns: ["document_version_id"]
            isOneToOne: false
            referencedRelation: "hse_document_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      hse_document_assignments: {
        Row: {
          accepted_at: string | null
          assigned_at: string | null
          assigned_by: string
          assignee_id: string | null
          assignee_type: string
          declined_at: string | null
          declined_reason: string | null
          document_id: string
          id: string
          status: Database["public"]["Enums"]["hse_doc_status"]
        }
        Insert: {
          accepted_at?: string | null
          assigned_at?: string | null
          assigned_by: string
          assignee_id?: string | null
          assignee_type: string
          declined_at?: string | null
          declined_reason?: string | null
          document_id: string
          id?: string
          status: Database["public"]["Enums"]["hse_doc_status"]
        }
        Update: {
          accepted_at?: string | null
          assigned_at?: string | null
          assigned_by?: string
          assignee_id?: string | null
          assignee_type?: string
          declined_at?: string | null
          declined_reason?: string | null
          document_id?: string
          id?: string
          status?: Database["public"]["Enums"]["hse_doc_status"]
        }
        Relationships: [
          {
            foreignKeyName: "hse_document_assignments_assignee_id_fkey"
            columns: ["assignee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hse_document_assignments_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "hse_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      hse_document_tag_assignments: {
        Row: {
          created_at: string | null
          document_id: string
          id: string
          tag_id: string
        }
        Insert: {
          created_at?: string | null
          document_id: string
          id?: string
          tag_id: string
        }
        Update: {
          created_at?: string | null
          document_id?: string
          id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hse_document_tag_assignments_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "hse_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hse_document_tag_assignments_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "training_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      hse_document_tags: {
        Row: {
          color: string | null
          company_id: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          company_id?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          company_id?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hse_document_tags_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company"
            referencedColumns: ["id"]
          },
        ]
      }
      hse_document_type_assignmente: {
        Row: {
          created_at: string | null
          docType_id: string
          document_id: string
          id: string
        }
        Insert: {
          created_at?: string | null
          docType_id: string
          document_id: string
          id?: string
        }
        Update: {
          created_at?: string | null
          docType_id?: string
          document_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hse_document_type_assignmente_docType_id_fkey"
            columns: ["docType_id"]
            isOneToOne: false
            referencedRelation: "training_tags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hse_document_type_assignmente_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "hse_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      hse_document_versions: {
        Row: {
          change_log: string | null
          created_at: string
          created_by: string
          description: string | null
          document_id: string
          expiry_date: string | null
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string | null
          id: string
          status: string | null
          title: string | null
          version: string
        }
        Insert: {
          change_log?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          document_id: string
          expiry_date?: string | null
          file_name: string
          file_path: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          status?: string | null
          title?: string | null
          version: string
        }
        Update: {
          change_log?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          document_id?: string
          expiry_date?: string | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          status?: string | null
          title?: string | null
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "hse_document_versions_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "hse_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      hse_documents: {
        Row: {
          company_id: string | null
          created_at: string | null
          created_by: string
          description: string | null
          docs_types: string | null
          expiry_date: string | null
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id: string
          status: string
          title: string
          updated_at: string | null
          upload_date: string | null
          version: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          created_by: string
          description?: string | null
          docs_types?: string | null
          expiry_date?: string | null
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id?: string
          status: string
          title: string
          updated_at?: string | null
          upload_date?: string | null
          version: string
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          created_by?: string
          description?: string | null
          docs_types?: string | null
          expiry_date?: string | null
          file_name?: string
          file_path?: string
          file_size?: number
          file_type?: string
          id?: string
          status?: string
          title?: string
          updated_at?: string | null
          upload_date?: string | null
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "hse_documents_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hse_documents_docs_types_fkey"
            columns: ["docs_types"]
            isOneToOne: false
            referencedRelation: "hse_doc_types"
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
          company_id: string | null
          created_at: string
          id: number
          is_active: boolean | null
          name: string | null
        }
        Insert: {
          brand?: number | null
          company_id?: string | null
          created_at?: string
          id?: number
          is_active?: boolean | null
          name?: string | null
        }
        Update: {
          brand?: number | null
          company_id?: string | null
          created_at?: string
          id?: number
          is_active?: boolean | null
          name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "model_vehicles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company"
            referencedColumns: ["id"]
          },
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
      payment_order_items: {
        Row: {
          amount: number
          id: string
          invoice_id: string | null
          payment_order_id: string
        }
        Insert: {
          amount: number
          id?: string
          invoice_id?: string | null
          payment_order_id: string
        }
        Update: {
          amount?: number
          id?: string
          invoice_id?: string | null
          payment_order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_order_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "purchase_invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_order_items_payment_order_id_fkey"
            columns: ["payment_order_id"]
            isOneToOne: false
            referencedRelation: "payment_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_order_payments: {
        Row: {
          amount: number
          bank_account_id: string | null
          card_last4: string | null
          cash_register_id: string | null
          check_number: string | null
          id: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          payment_order_id: string
          reference: string | null
          supplier_payment_method_id: string | null
        }
        Insert: {
          amount: number
          bank_account_id?: string | null
          card_last4?: string | null
          cash_register_id?: string | null
          check_number?: string | null
          id?: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          payment_order_id: string
          reference?: string | null
          supplier_payment_method_id?: string | null
        }
        Update: {
          amount?: number
          bank_account_id?: string | null
          card_last4?: string | null
          cash_register_id?: string | null
          check_number?: string | null
          id?: string
          payment_method?: Database["public"]["Enums"]["payment_method"]
          payment_order_id?: string
          reference?: string | null
          supplier_payment_method_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_order_payments_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_order_payments_cash_register_id_fkey"
            columns: ["cash_register_id"]
            isOneToOne: false
            referencedRelation: "cash_registers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_order_payments_payment_order_id_fkey"
            columns: ["payment_order_id"]
            isOneToOne: false
            referencedRelation: "payment_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_order_payments_supplier_payment_method_id_fkey"
            columns: ["supplier_payment_method_id"]
            isOneToOne: false
            referencedRelation: "supplier_payment_methods"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_orders: {
        Row: {
          company_id: string
          confirmed_at: string | null
          confirmed_by: string | null
          created_at: string
          created_by: string
          date: string
          document_key: string | null
          document_url: string | null
          full_number: string
          id: string
          notes: string | null
          number: number
          paid_at: string | null
          paid_by: string | null
          status: Database["public"]["Enums"]["payment_order_status"]
          supplier_id: string | null
          total_amount: number
          updated_at: string
        }
        Insert: {
          company_id: string
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          created_by: string
          date: string
          document_key?: string | null
          document_url?: string | null
          full_number: string
          id?: string
          notes?: string | null
          number: number
          paid_at?: string | null
          paid_by?: string | null
          status?: Database["public"]["Enums"]["payment_order_status"]
          supplier_id?: string | null
          total_amount: number
          updated_at?: string
        }
        Update: {
          company_id?: string
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          created_by?: string
          date?: string
          document_key?: string | null
          document_url?: string | null
          full_number?: string
          id?: string
          notes?: string | null
          number?: number
          paid_at?: string | null
          paid_by?: string | null
          status?: Database["public"]["Enums"]["payment_order_status"]
          supplier_id?: string | null
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_orders_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_orders_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      pdf_settings: {
        Row: {
          company_id: string
          created_at: string
          footer_text: string | null
          header_text: string | null
          id: string
          signature_image_url: string | null
          signed_pdf_keys: string[]
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          footer_text?: string | null
          header_text?: string | null
          id?: string
          signature_image_url?: string | null
          signed_pdf_keys?: string[]
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          footer_text?: string | null
          header_text?: string | null
          id?: string
          signature_image_url?: string | null
          signed_pdf_keys?: string[]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pdf_settings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "company"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          barcode: string | null
          brand: string | null
          code: string
          company_id: string
          cost_price: number
          created_at: string
          description: string | null
          id: string
          max_stock: number | null
          min_stock: number | null
          name: string
          sale_price: number
          status: Database["public"]["Enums"]["product_status"]
          track_stock: boolean
          type: Database["public"]["Enums"]["product_type"]
          unit_of_measure: string
          updated_at: string
          vat_rate: number
        }
        Insert: {
          barcode?: string | null
          brand?: string | null
          code: string
          company_id: string
          cost_price?: number
          created_at?: string
          description?: string | null
          id?: string
          max_stock?: number | null
          min_stock?: number | null
          name: string
          sale_price?: number
          status?: Database["public"]["Enums"]["product_status"]
          track_stock?: boolean
          type?: Database["public"]["Enums"]["product_type"]
          unit_of_measure?: string
          updated_at?: string
          vat_rate?: number
        }
        Update: {
          barcode?: string | null
          brand?: string | null
          code?: string
          company_id?: string
          cost_price?: number
          created_at?: string
          description?: string | null
          id?: string
          max_stock?: number | null
          min_stock?: number | null
          name?: string
          sale_price?: number
          status?: Database["public"]["Enums"]["product_status"]
          track_stock?: boolean
          type?: Database["public"]["Enums"]["product_type"]
          unit_of_measure?: string
          updated_at?: string
          vat_rate?: number
        }
        Relationships: [
          {
            foreignKeyName: "products_company_id_fkey"
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
          modulos:
            | Database["public"]["Enums"]["modulos__old_version_to_be_dropped"][]
            | null
          password_hash: string | null
          role: string | null
        }
        Insert: {
          avatar?: string | null
          created_at?: string | null
          credential_id?: string | null
          email?: string | null
          fullname?: string | null
          id: string
          modulos?:
            | Database["public"]["Enums"]["modulos__old_version_to_be_dropped"][]
            | null
          password_hash?: string | null
          role?: string | null
        }
        Update: {
          avatar?: string | null
          created_at?: string | null
          credential_id?: string | null
          email?: string | null
          fullname?: string | null
          id?: string
          modulos?:
            | Database["public"]["Enums"]["modulos__old_version_to_be_dropped"][]
            | null
          password_hash?: string | null
          role?: string | null
        }
        Relationships: [
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
      purchase_invoice_lines: {
        Row: {
          description: string
          id: string
          invoice_id: string
          product_id: string | null
          purchase_order_line_id: string | null
          quantity: number
          received_qty: number
          subtotal: number
          total: number
          unit_cost: number
          vat_amount: number
          vat_rate: number
        }
        Insert: {
          description: string
          id?: string
          invoice_id: string
          product_id?: string | null
          purchase_order_line_id?: string | null
          quantity: number
          received_qty?: number
          subtotal: number
          total: number
          unit_cost: number
          vat_amount: number
          vat_rate: number
        }
        Update: {
          description?: string
          id?: string
          invoice_id?: string
          product_id?: string | null
          purchase_order_line_id?: string | null
          quantity?: number
          received_qty?: number
          subtotal?: number
          total?: number
          unit_cost?: number
          vat_amount?: number
          vat_rate?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchase_invoice_lines_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "purchase_invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_invoice_lines_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_invoice_lines_purchase_order_line_id_fkey"
            columns: ["purchase_order_line_id"]
            isOneToOne: false
            referencedRelation: "purchase_order_lines"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_invoices: {
        Row: {
          cae: string | null
          company_id: string
          created_at: string
          created_by: string | null
          document_key: string | null
          document_url: string | null
          due_date: string | null
          full_number: string
          id: string
          issue_date: string
          notes: string | null
          number: string
          original_invoice_id: string | null
          other_taxes: number
          point_of_sale: string
          purchase_order_id: string | null
          receiving_status: Database["public"]["Enums"]["purchase_invoice_receiving_status"]
          status: Database["public"]["Enums"]["purchase_invoice_status"]
          subtotal: number
          supplier_id: string
          total: number
          updated_at: string
          vat_amount: number
          voucher_type: Database["public"]["Enums"]["voucher_type"]
        }
        Insert: {
          cae?: string | null
          company_id: string
          created_at?: string
          created_by?: string | null
          document_key?: string | null
          document_url?: string | null
          due_date?: string | null
          full_number: string
          id?: string
          issue_date: string
          notes?: string | null
          number: string
          original_invoice_id?: string | null
          other_taxes?: number
          point_of_sale: string
          purchase_order_id?: string | null
          receiving_status?: Database["public"]["Enums"]["purchase_invoice_receiving_status"]
          status?: Database["public"]["Enums"]["purchase_invoice_status"]
          subtotal?: number
          supplier_id: string
          total?: number
          updated_at?: string
          vat_amount?: number
          voucher_type: Database["public"]["Enums"]["voucher_type"]
        }
        Update: {
          cae?: string | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          document_key?: string | null
          document_url?: string | null
          due_date?: string | null
          full_number?: string
          id?: string
          issue_date?: string
          notes?: string | null
          number?: string
          original_invoice_id?: string | null
          other_taxes?: number
          point_of_sale?: string
          purchase_order_id?: string | null
          receiving_status?: Database["public"]["Enums"]["purchase_invoice_receiving_status"]
          status?: Database["public"]["Enums"]["purchase_invoice_status"]
          subtotal?: number
          supplier_id?: string
          total?: number
          updated_at?: string
          vat_amount?: number
          voucher_type?: Database["public"]["Enums"]["voucher_type"]
        }
        Relationships: [
          {
            foreignKeyName: "purchase_invoices_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_invoices_original_invoice_id_fkey"
            columns: ["original_invoice_id"]
            isOneToOne: false
            referencedRelation: "purchase_invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_invoices_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_invoices_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_order_installments: {
        Row: {
          amount: number
          company_id: string
          created_at: string
          due_date: string
          id: string
          notes: string | null
          number: number
          order_id: string
          purchase_invoice_id: string | null
          status: Database["public"]["Enums"]["purchase_order_installment_status"]
          updated_at: string
        }
        Insert: {
          amount: number
          company_id: string
          created_at?: string
          due_date: string
          id?: string
          notes?: string | null
          number: number
          order_id: string
          purchase_invoice_id?: string | null
          status?: Database["public"]["Enums"]["purchase_order_installment_status"]
          updated_at?: string
        }
        Update: {
          amount?: number
          company_id?: string
          created_at?: string
          due_date?: string
          id?: string
          notes?: string | null
          number?: number
          order_id?: string
          purchase_invoice_id?: string | null
          status?: Database["public"]["Enums"]["purchase_order_installment_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_order_installments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_order_installments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_order_installments_purchase_invoice_id_fkey"
            columns: ["purchase_invoice_id"]
            isOneToOne: false
            referencedRelation: "purchase_invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_order_lines: {
        Row: {
          description: string
          id: string
          invoiced_qty: number
          order_id: string
          product_id: string | null
          quantity: number
          received_qty: number
          subtotal: number
          total: number
          unit_cost: number
          vat_amount: number
          vat_rate: number
        }
        Insert: {
          description: string
          id?: string
          invoiced_qty?: number
          order_id: string
          product_id?: string | null
          quantity: number
          received_qty?: number
          subtotal: number
          total: number
          unit_cost: number
          vat_amount: number
          vat_rate: number
        }
        Update: {
          description?: string
          id?: string
          invoiced_qty?: number
          order_id?: string
          product_id?: string | null
          quantity?: number
          received_qty?: number
          subtotal?: number
          total?: number
          unit_cost?: number
          vat_amount?: number
          vat_rate?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchase_order_lines_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_order_lines_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_orders: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          company_id: string
          created_at: string
          created_by: string | null
          delivery_address: string | null
          delivery_notes: string | null
          expected_delivery_date: string | null
          full_number: string
          id: string
          invoicing_status: Database["public"]["Enums"]["purchase_order_invoicing_status"]
          issue_date: string
          notes: string | null
          number: number
          payment_conditions: string | null
          status: Database["public"]["Enums"]["purchase_order_status"]
          subtotal: number
          supplier_id: string
          total: number
          updated_at: string
          vat_amount: number
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          company_id: string
          created_at?: string
          created_by?: string | null
          delivery_address?: string | null
          delivery_notes?: string | null
          expected_delivery_date?: string | null
          full_number: string
          id?: string
          invoicing_status?: Database["public"]["Enums"]["purchase_order_invoicing_status"]
          issue_date: string
          notes?: string | null
          number: number
          payment_conditions?: string | null
          status?: Database["public"]["Enums"]["purchase_order_status"]
          subtotal?: number
          supplier_id: string
          total?: number
          updated_at?: string
          vat_amount?: number
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          delivery_address?: string | null
          delivery_notes?: string | null
          expected_delivery_date?: string | null
          full_number?: string
          id?: string
          invoicing_status?: Database["public"]["Enums"]["purchase_order_invoicing_status"]
          issue_date?: string
          notes?: string | null
          number?: number
          payment_conditions?: string | null
          status?: Database["public"]["Enums"]["purchase_order_status"]
          subtotal?: number
          supplier_id?: string
          total?: number
          updated_at?: string
          vat_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchase_orders_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      receiving_note_lines: {
        Row: {
          description: string
          id: string
          notes: string | null
          product_id: string
          purchase_invoice_line_id: string | null
          purchase_order_line_id: string | null
          quantity: number
          receiving_note_id: string
        }
        Insert: {
          description: string
          id?: string
          notes?: string | null
          product_id: string
          purchase_invoice_line_id?: string | null
          purchase_order_line_id?: string | null
          quantity: number
          receiving_note_id: string
        }
        Update: {
          description?: string
          id?: string
          notes?: string | null
          product_id?: string
          purchase_invoice_line_id?: string | null
          purchase_order_line_id?: string | null
          quantity?: number
          receiving_note_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "receiving_note_lines_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receiving_note_lines_purchase_invoice_line_id_fkey"
            columns: ["purchase_invoice_line_id"]
            isOneToOne: false
            referencedRelation: "purchase_invoice_lines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receiving_note_lines_purchase_order_line_id_fkey"
            columns: ["purchase_order_line_id"]
            isOneToOne: false
            referencedRelation: "purchase_order_lines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receiving_note_lines_receiving_note_id_fkey"
            columns: ["receiving_note_id"]
            isOneToOne: false
            referencedRelation: "receiving_notes"
            referencedColumns: ["id"]
          },
        ]
      }
      receiving_notes: {
        Row: {
          company_id: string
          created_at: string
          created_by: string | null
          full_number: string
          id: string
          notes: string | null
          number: number
          purchase_invoice_id: string | null
          purchase_order_id: string | null
          reception_date: string
          status: Database["public"]["Enums"]["receiving_note_status"]
          supplier_id: string
          updated_at: string
          warehouse_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by?: string | null
          full_number: string
          id?: string
          notes?: string | null
          number: number
          purchase_invoice_id?: string | null
          purchase_order_id?: string | null
          reception_date: string
          status?: Database["public"]["Enums"]["receiving_note_status"]
          supplier_id: string
          updated_at?: string
          warehouse_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string | null
          full_number?: string
          id?: string
          notes?: string | null
          number?: number
          purchase_invoice_id?: string | null
          purchase_order_id?: string | null
          reception_date?: string
          status?: Database["public"]["Enums"]["receiving_note_status"]
          supplier_id?: string
          updated_at?: string
          warehouse_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "receiving_notes_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receiving_notes_purchase_invoice_id_fkey"
            columns: ["purchase_invoice_id"]
            isOneToOne: false
            referencedRelation: "purchase_invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receiving_notes_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receiving_notes_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receiving_notes_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
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
      stock_movements: {
        Row: {
          company_id: string
          created_at: string
          created_by: string | null
          date: string
          id: string
          notes: string | null
          product_id: string
          quantity: number
          reference_id: string | null
          reference_type: string | null
          type: Database["public"]["Enums"]["stock_movement_type"]
          warehouse_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by?: string | null
          date?: string
          id?: string
          notes?: string | null
          product_id: string
          quantity: number
          reference_id?: string | null
          reference_type?: string | null
          type: Database["public"]["Enums"]["stock_movement_type"]
          warehouse_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string | null
          date?: string
          id?: string
          notes?: string | null
          product_id?: string
          quantity?: number
          reference_id?: string | null
          reference_type?: string | null
          type?: Database["public"]["Enums"]["stock_movement_type"]
          warehouse_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
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
      supplier_payment_methods: {
        Row: {
          account_holder: string | null
          account_holder_tax_id: string | null
          account_type:
            | Database["public"]["Enums"]["supplier_account_type"]
            | null
          alias: string | null
          bank_name: string | null
          cbu: string | null
          company_id: string
          created_at: string
          created_by: string | null
          currency: string | null
          id: string
          is_default: boolean
          status: Database["public"]["Enums"]["supplier_status"]
          supplier_id: string
          type: Database["public"]["Enums"]["payment_method"]
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          account_holder?: string | null
          account_holder_tax_id?: string | null
          account_type?:
            | Database["public"]["Enums"]["supplier_account_type"]
            | null
          alias?: string | null
          bank_name?: string | null
          cbu?: string | null
          company_id: string
          created_at?: string
          created_by?: string | null
          currency?: string | null
          id?: string
          is_default?: boolean
          status?: Database["public"]["Enums"]["supplier_status"]
          supplier_id: string
          type: Database["public"]["Enums"]["payment_method"]
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          account_holder?: string | null
          account_holder_tax_id?: string | null
          account_type?:
            | Database["public"]["Enums"]["supplier_account_type"]
            | null
          alias?: string | null
          bank_name?: string | null
          cbu?: string | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          currency?: string | null
          id?: string
          is_default?: boolean
          status?: Database["public"]["Enums"]["supplier_status"]
          supplier_id?: string
          type?: Database["public"]["Enums"]["payment_method"]
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "supplier_payment_methods_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_payment_methods_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          address: string | null
          business_name: string
          city: string | null
          code: string
          company_id: string
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          country: string
          created_at: string
          credit_limit: number | null
          email: string | null
          id: string
          notes: string | null
          payment_term_days: number
          phone: string | null
          province: string | null
          status: Database["public"]["Enums"]["supplier_status"]
          tax_condition: Database["public"]["Enums"]["supplier_tax_condition"]
          tax_id: string
          trade_name: string | null
          updated_at: string
          website: string | null
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          business_name: string
          city?: string | null
          code: string
          company_id: string
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          country?: string
          created_at?: string
          credit_limit?: number | null
          email?: string | null
          id?: string
          notes?: string | null
          payment_term_days?: number
          phone?: string | null
          province?: string | null
          status?: Database["public"]["Enums"]["supplier_status"]
          tax_condition: Database["public"]["Enums"]["supplier_tax_condition"]
          tax_id: string
          trade_name?: string | null
          updated_at?: string
          website?: string | null
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          business_name?: string
          city?: string | null
          code?: string
          company_id?: string
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          country?: string
          created_at?: string
          credit_limit?: number | null
          email?: string | null
          id?: string
          notes?: string | null
          payment_term_days?: number
          phone?: string | null
          province?: string | null
          status?: Database["public"]["Enums"]["supplier_status"]
          tax_condition?: Database["public"]["Enums"]["supplier_tax_condition"]
          tax_id?: string
          trade_name?: string | null
          updated_at?: string
          website?: string | null
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "suppliers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company"
            referencedColumns: ["id"]
          },
        ]
      }
      training_tag_assignments: {
        Row: {
          tag_id: string
          training_id: string
        }
        Insert: {
          tag_id: string
          training_id: string
        }
        Update: {
          tag_id?: string
          training_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_tag"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "training_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      training_tags: {
        Row: {
          color: string | null
          created_at: string | null
          id: string
          is_active: boolean
          name: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean
          name: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean
          name?: string
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
      types_of_contracts: {
        Row: {
          company_id: string | null
          created_at: string
          id: string
          is_active: boolean
          name: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "types_of_contracts_company_id_fkey"
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
      user_table_preferences: {
        Row: {
          column_visibility: Json | null
          created_at: string | null
          filter_visibility: Json | null
          id: string
          table_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          column_visibility?: Json | null
          created_at?: string | null
          filter_visibility?: Json | null
          id?: string
          table_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          column_visibility?: Json | null
          created_at?: string | null
          filter_visibility?: Json | null
          id?: string
          table_id?: string
          updated_at?: string | null
          user_id?: string
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
      warehouse_stocks: {
        Row: {
          available_qty: number
          id: string
          product_id: string
          quantity: number
          reserved_qty: number
          updated_at: string
          warehouse_id: string
        }
        Insert: {
          available_qty?: number
          id?: string
          product_id: string
          quantity?: number
          reserved_qty?: number
          updated_at?: string
          warehouse_id: string
        }
        Update: {
          available_qty?: number
          id?: string
          product_id?: string
          quantity?: number
          reserved_qty?: number
          updated_at?: string
          warehouse_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "warehouse_stocks_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warehouse_stocks_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      warehouses: {
        Row: {
          address: string | null
          city: string | null
          code: string
          company_id: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          province: string | null
          type: Database["public"]["Enums"]["warehouse_type"]
          updated_at: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          code: string
          company_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          province?: string | null
          type?: Database["public"]["Enums"]["warehouse_type"]
          updated_at?: string
        }
        Update: {
          address?: string | null
          city?: string | null
          code?: string
          company_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          province?: string | null
          type?: Database["public"]["Enums"]["warehouse_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "warehouses_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company"
            referencedColumns: ["id"]
          },
        ]
      }
      withdrawal_order_lines: {
        Row: {
          description: string
          id: string
          notes: string | null
          order_id: string
          product_id: string
          quantity: number
        }
        Insert: {
          description: string
          id?: string
          notes?: string | null
          order_id: string
          product_id: string
          quantity: number
        }
        Update: {
          description?: string
          id?: string
          notes?: string | null
          order_id?: string
          product_id?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "withdrawal_order_lines_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "withdrawal_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "withdrawal_order_lines_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      withdrawal_orders: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          company_id: string
          completed_at: string | null
          created_at: string
          created_by: string | null
          employee_id: string | null
          full_number: string
          id: string
          notes: string | null
          number: number
          request_date: string
          status: Database["public"]["Enums"]["withdrawal_order_status"]
          updated_at: string
          vehicle_id: string | null
          warehouse_id: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          company_id: string
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          employee_id?: string | null
          full_number: string
          id?: string
          notes?: string | null
          number: number
          request_date: string
          status?: Database["public"]["Enums"]["withdrawal_order_status"]
          updated_at?: string
          vehicle_id?: string | null
          warehouse_id: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          company_id?: string
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          employee_id?: string | null
          full_number?: string
          id?: string
          notes?: string | null
          number?: number
          request_date?: string
          status?: Database["public"]["Enums"]["withdrawal_order_status"]
          updated_at?: string
          vehicle_id?: string | null
          warehouse_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "withdrawal_orders_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "withdrawal_orders_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "withdrawal_orders_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "withdrawal_orders_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      "work-diagram": {
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
            foreignKeyName: "work-diagram_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company"
            referencedColumns: ["id"]
          },
        ]
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
          born_date: string | null
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
          type_of_contract: string
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
      bank_account_status: "ACTIVE" | "INACTIVE" | "CLOSED"
      bank_account_type:
        | "CHECKING"
        | "SAVINGS"
        | "CREDIT"
        | "CASH"
        | "VIRTUAL_WALLET"
      bank_movement_type:
        | "DEPOSIT"
        | "WITHDRAWAL"
        | "TRANSFER_IN"
        | "TRANSFER_OUT"
        | "CHECK"
        | "DEBIT"
        | "FEE"
        | "INTEREST"
      cash_movement_type:
        | "OPENING"
        | "CLOSING"
        | "INCOME"
        | "EXPENSE"
        | "ADJUSTMENT"
      cash_register_status: "ACTIVE" | "INACTIVE"
      check_status:
        | "PORTFOLIO"
        | "DEPOSITED"
        | "CLEARED"
        | "REJECTED"
        | "ENDORSED"
        | "DELIVERED"
        | "CASHED"
        | "VOIDED"
      check_type: "OWN" | "THIRD_PARTY"
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
      hse_doc_status: "pendiente" | "aceptado" | "rechazado" | "pending"
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
        | "proveedores"
        | "almacenes"
        | "compras"
        | "tesoreria"
      modulos__old_version_to_be_dropped:
        | "empresa"
        | "empleados"
        | "equipos"
        | "documentación"
        | "mantenimiento"
        | "dashboard"
        | "ayuda"
      nationality_enum: "Argentina" | "Extranjero"
      notification_categories:
        | "vencimiento"
        | "noticia"
        | "advertencia"
        | "aprobado"
        | "rechazado"
      payment_method:
        | "CASH"
        | "CHECK"
        | "TRANSFER"
        | "DEBIT_CARD"
        | "CREDIT_CARD"
        | "ACCOUNT"
      payment_order_status: "DRAFT" | "CONFIRMED" | "PAID" | "CANCELLED"
      product_status: "ACTIVE" | "INACTIVE" | "DISCONTINUED"
      product_type: "PRODUCT" | "SERVICE" | "RAW_MATERIAL" | "CONSUMABLE"
      purchase_invoice_receiving_status:
        | "NOT_RECEIVED"
        | "PARTIALLY_RECEIVED"
        | "FULLY_RECEIVED"
      purchase_invoice_status:
        | "DRAFT"
        | "CONFIRMED"
        | "PAID"
        | "PARTIAL_PAID"
        | "CANCELLED"
      purchase_order_installment_status: "PENDING" | "INVOICED" | "PAID"
      purchase_order_invoicing_status:
        | "NOT_INVOICED"
        | "PARTIALLY_INVOICED"
        | "FULLY_INVOICED"
      purchase_order_status:
        | "DRAFT"
        | "PENDING_APPROVAL"
        | "APPROVED"
        | "PARTIALLY_RECEIVED"
        | "COMPLETED"
        | "CANCELLED"
      reason_for_termination_enum:
        | "Despido sin causa"
        | "Renuncia"
        | "Despido con causa"
        | "Acuerdo de partes"
        | "Fin de contrato"
        | "Fallecimiento"
      receiving_note_status: "DRAFT" | "CONFIRMED" | "CANCELLED"
      repair_state:
        | "Pendiente"
        | "Esperando repuestos"
        | "En reparación"
        | "Finalizado"
        | "Rechazado"
        | "Cancelado"
        | "Programado"
      roles_enum: "Externo" | "Auditor"
      session_status: "OPEN" | "CLOSED"
      state: "presentado" | "rechazado" | "aprobado" | "vencido" | "pendiente"
      status_type:
        | "Avalado"
        | "No avalado"
        | "Incompleto"
        | "Completo"
        | "Completo con doc vencida"
      stock_movement_type:
        | "PURCHASE"
        | "SALE"
        | "ADJUSTMENT"
        | "TRANSFER_OUT"
        | "TRANSFER_IN"
        | "RETURN"
        | "PRODUCTION"
        | "LOSS"
        | "WITHDRAWAL"
      supplier_account_type: "CHECKING" | "SAVINGS"
      supplier_status: "ACTIVE" | "INACTIVE" | "BLOCKED"
      supplier_tax_condition:
        | "RESPONSABLE_INSCRIPTO"
        | "MONOTRIBUTISTA"
        | "EXENTO"
        | "NO_RESPONSABLE"
        | "CONSUMIDOR_FINAL"
      type_of_maintenance_ENUM: "Correctivo" | "Preventivo"
      voucher_type:
        | "FACTURA_A"
        | "FACTURA_B"
        | "FACTURA_C"
        | "NOTA_CREDITO_A"
        | "NOTA_CREDITO_B"
        | "NOTA_CREDITO_C"
        | "NOTA_DEBITO_A"
        | "NOTA_DEBITO_B"
        | "NOTA_DEBITO_C"
        | "RECIBO"
      warehouse_type: "MAIN" | "BRANCH" | "TRANSIT" | "VIRTUAL"
      withdrawal_order_status:
        | "DRAFT"
        | "PENDING_APPROVAL"
        | "APPROVED"
        | "COMPLETED"
        | "CANCELLED"
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

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

