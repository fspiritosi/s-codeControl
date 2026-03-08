"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Code2,
  Layers,
  Rocket,
  Database,
  Headphones,
  Cloud,
  Clock,
  Users,
  Heart,
  Monitor,
  Wrench,
  BarChart3,
  CheckCircle2,
  ArrowRight,
  Menu,
  X,
  Mail,
  Phone,
  MapPin,
  Linkedin,
  Instagram,
  Twitter,
  Send,

} from "lucide-react";
import Link from "next/link";
type Status = "success" | "error" | null;

export default function CodeControlLanding() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    telefono: "",
    empresa: "",
    mensaje: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<Status>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simular envío del formulario
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    setSubmitStatus("success");
    setIsSubmitting(false);
    setFormData({ nombre: "", email: "", telefono: "", empresa: "", mensaje: "" });
    
    setTimeout(() => setSubmitStatus(null), 5000);
  };

  const servicios = [
    {
      icon: Code2,
      titulo: "Desarrollo a Medida",
      descripcion: "Colaboramos estrechamente para diseñar soluciones que superen tus expectativas.",
    },
    {
      icon: Layers,
      titulo: "Escalabilidad y Flexibilidad",
      descripcion: "Soluciones diseñadas para crecer junto con tu negocio, desde apps web hasta plataformas empresariales.",
    },
    {
      icon: Rocket,
      titulo: "Tecnología de Punta",
      descripcion: "Next.js, React Native y SQL para aplicaciones web y móviles rápidas y seguras.",
    },
    {
      icon: Database,
      titulo: "Bases de Datos SQL y NoSQL",
      descripcion: "MongoDB, Firebase y SQL para proyectos que requieren flexibilidad y alta disponibilidad.",
    },
    {
      icon: Headphones,
      titulo: "Soporte Personalizado",
      descripcion: "Soporte continuo para asegurar que tu aplicación funcione siempre a máxima capacidad.",
    },
    {
      icon: Cloud,
      titulo: "Infraestructura en la Nube",
      descripcion: "Implementación en AWS garantizando escalabilidad, seguridad y disponibilidad.",
    },
    {
      icon: Clock,
      titulo: "Entrega Rápida",
      descripcion: "Enfoque ágil para entregar proyectos de alta calidad dentro de los plazos.",
    },
    {
      icon: Users,
      titulo: "Metodologías Ágiles",
      descripcion: "Scrum para gestión eficiente, adaptándonos rápidamente a los cambios.",
    },
    {
      icon: Heart,
      titulo: "Satisfacción del Cliente",
      descripcion: "Construimos relaciones a largo plazo basadas en confianza y excelencia.",
    },
  ];

  const caracteristicasApp = [
    {
      icon: Monitor,
      titulo: "Gestión de Empleados y Equipos",
      descripcion: "Todos tus recursos en una sola plataforma. Centraliza información y optimiza comunicación.",
    },
    {
      icon: Wrench,
      titulo: "Gestión de Mantenimiento",
      descripcion: "Gestiona el mantenimiento de equipos, vehículos y maquinarias. Lleva orden a tu taller.",
    },
    {
      icon: BarChart3,
      titulo: "Gestión de Operaciones",
      descripcion: "Tu gente, equipos y operaciones siempre conectados. Optimiza tus procesos.",
    },
  ];

  const beneficios = [
    "Información actualizada",
    "Mantén tus recursos",
    "Facilita la búsqueda",
    "Digitaliza tu operación",
    "Centraliza la información",
    "Protege tus datos",
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo */}
            <a href="#" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-xl">C</span>
              </div>
              <span className="text-xl font-bold text-gray-900">
                code<span className="text-blue-500">Control</span>
              </span>
            </a>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-8">
              <a href="#inicio" className="text-gray-600 hover:text-blue-500 transition-colors font-medium">
                Inicio
              </a>
              <a href="#servicios" className="text-gray-600 hover:text-blue-500 transition-colors font-medium">
                Qué Ofrecemos
              </a>
              <a href="#webapp" className="text-gray-600 hover:text-blue-500 transition-colors font-medium">
                Nuestra App
              </a>
              <a href="#contacto" className="text-gray-600 hover:text-blue-500 transition-colors font-medium">
                Contacto
              </a>
            </nav>

            {/* CTA Button */}
            <div className="hidden lg:flex items-center gap-4">
                <Link href="/login">
              <Button
                variant="outline"
                className="border-blue-500 text-blue-500 hover:bg-blue-50"
              >
                Iniciar Sesión
              </Button>
              </Link>
              <Button className="bg-blue-500 hover:bg-blue-600 text-white">
                Comenzar Ahora
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="lg:hidden p-2 text-gray-600"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="lg:hidden bg-white border-t border-gray-100 py-4">
            <nav className="flex flex-col gap-2 px-4">
              <a href="#inicio" className="py-2 text-gray-600 hover:text-blue-500" onClick={() => setIsMenuOpen(false)}>
                Inicio
              </a>
              <a href="#servicios" className="py-2 text-gray-600 hover:text-blue-500" onClick={() => setIsMenuOpen(false)}>
                Qué Ofrecemos
              </a>
              <a href="#webapp" className="py-2 text-gray-600 hover:text-blue-500" onClick={() => setIsMenuOpen(false)}>
                Nuestra App
              </a>
              <a href="#contacto" className="py-2 text-gray-600 hover:text-blue-500" onClick={() => setIsMenuOpen(false)}>
                Contacto
              </a>
              <div className="flex flex-col gap-2 pt-4">
                <Link href="/login">
                <Button variant="outline" className="border-blue-500 text-blue-500">
                  Iniciar Sesión
                </Button>
                </Link>
                <Button className="bg-blue-500 hover:bg-blue-600 text-white">
                  Comenzar Ahora
                </Button>
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section id="inicio" className="relative pt-24 lg:pt-32 pb-16 lg:pb-24 overflow-hidden">
        {/* Background decorations */}
        <div className="absolute top-20 right-0 w-96 h-96 bg-blue-100 rounded-full blur-3xl opacity-50 -z-10" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-50 rounded-full blur-2xl opacity-60 -z-10" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <Badge className="mb-6 bg-blue-100 text-blue-600 hover:bg-blue-100 border-0">
                🚀 Soluciones de Software Personalizadas
              </Badge>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
                Gestioná eficientemente todos tus procesos con{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-blue-600">
                  CodeControl
                </span>
              </h1>
              <p className="text-lg sm:text-xl text-gray-600 mb-8 max-w-xl mx-auto lg:mx-0">
                Soluciones innovadoras y personalizadas de software para impulsar 
                el éxito de tu negocio. Transformamos ideas en aplicaciones potentes.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button size="lg" className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-6 text-lg">
                  Solicitar Demo
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button size="lg" variant="outline" className="border-gray-300 text-gray-700 px-8 py-6 text-lg">
                  Ver Servicios
                </Button>
              </div>
              
              {/* Stats */}
              <div className="grid grid-cols-3 gap-6 mt-12 pt-8 border-t border-gray-100">
                <div>
                  <div className="text-3xl font-bold text-gray-900">50+</div>
                  <div className="text-sm text-gray-500">Proyectos Entregados</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-gray-900">98%</div>
                  <div className="text-sm text-gray-500">Clientes Satisfechos</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-gray-900">24/7</div>
                  <div className="text-sm text-gray-500">Soporte Técnico</div>
                </div>
              </div>
            </div>
            
            {/* Hero Image/Illustration */}
            <div className="relative hidden lg:block">
              <div className="relative">
                {/* Main card */}
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 shadow-2xl">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                    <div className="w-3 h-3 rounded-full bg-yellow-400" />
                    <div className="w-3 h-3 rounded-full bg-green-400" />
                  </div>
                  <div className="space-y-3">
                    <div className="h-4 w-3/4 bg-blue-500/30 rounded" />
                    <div className="h-4 w-1/2 bg-slate-700 rounded" />
                    <div className="h-4 w-5/6 bg-slate-700 rounded" />
                    <div className="h-4 w-2/3 bg-green-500/30 rounded" />
                    <div className="h-4 w-3/4 bg-slate-700 rounded" />
                  </div>
                </div>
                
                {/* Floating cards */}
                <div className="absolute -top-4 -right-4 bg-white rounded-xl p-4 shadow-lg border border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">Deploy exitoso</div>
                      <div className="text-xs text-gray-500">Hace 2 minutos</div>
                    </div>
                  </div>
                </div>
                
                <div className="absolute -bottom-4 -left-4 bg-white rounded-xl p-4 shadow-lg border border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Rocket className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">Performance +40%</div>
                      <div className="text-xs text-gray-500">Optimizado</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="servicios" className="py-16 lg:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 lg:mb-16">
            <Badge className="mb-4 bg-blue-100 text-blue-600 hover:bg-blue-100 border-0">
              Nuestros Servicios
            </Badge>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Qué Ofrecemos
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Combinamos control de procesos, desarrollo de software y consultoría 
              organizacional para ofrecerte soluciones integrales que generan resultados reales.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {servicios.map((servicio, index) => (
              <Card 
                key={index} 
                className="group hover:shadow-xl transition-all duration-300 border-0 bg-white hover:-translate-y-1"
              >
                <CardHeader>
                  <div className="w-14 h-14 bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <servicio.icon className="w-7 h-7 text-blue-400" />
                  </div>
                  <CardTitle className="text-xl text-gray-900">{servicio.titulo}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600 text-base">
                    {servicio.descripcion}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Web App Section */}
      <section id="webapp" className="py-16 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div>
              <Badge className="mb-4 bg-blue-100 text-blue-600 hover:bg-blue-100 border-0">
                Nuestra Solución
              </Badge>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
                Nuestra Web APP es la solución perfecta para tu empresa
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Una plataforma integral que centraliza y optimiza la gestión de empleados, 
                equipos y documentación en tu empresa. Simplifica la gestión documental, 
                el mantenimiento de equipos y la planificación de operaciones.
              </p>
              
              {/* Benefits list */}
              <div className="grid grid-cols-2 gap-3 mb-8">
                {beneficios.map((beneficio, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-blue-500 flex-shrink-0" />
                    <span className="text-gray-700">{beneficio}</span>
                  </div>
                ))}
              </div>
              
              <Button size="lg" className="bg-blue-500 hover:bg-blue-600 text-white">
                Conocer Más
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
            
            {/* Features cards */}
            <div className="space-y-6">
              {caracteristicasApp.map((caracteristica, index) => (
                <Card 
                  key={index} 
                  className="hover:shadow-lg transition-all duration-300 border border-gray-100 hover:border-blue-200"
                >
                  <CardContent className="p-6">
                    <div className="flex gap-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <caracteristica.icon className="w-6 h-6 text-blue-500" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          {caracteristica.titulo}
                        </h3>
                        <p className="text-gray-600">
                          {caracteristica.descripcion}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contacto" className="py-16 lg:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16">
            {/* Contact Info */}
            <div>
              <Badge className="mb-4 bg-blue-100 text-blue-600 hover:bg-blue-100 border-0">
                Contactanos
              </Badge>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
                ¿Listo para impulsar tu negocio?
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Contanos sobre tu proyecto y te ayudamos a encontrar la solución 
                perfecta para tu empresa. Nuestro equipo está listo para asesorarte.
              </p>
              
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Mail className="w-6 h-6 text-blue-500" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Email</div>
                    <a href="mailto:contacto@codecontrol.com.ar" className="text-gray-900 font-medium hover:text-blue-500">
                      contacto@codecontrol.com.ar
                    </a>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Phone className="w-6 h-6 text-blue-500" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Teléfono</div>
                    <a href="tel:+5491112345678" className="text-gray-900 font-medium hover:text-blue-500">
                      +54 9 11 1234-5678
                    </a>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <MapPin className="w-6 h-6 text-blue-500" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Ubicación</div>
                    <div className="text-gray-900 font-medium">
                      Buenos Aires, Argentina
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Social Links */}
              <div className="flex gap-4 mt-8">
                <a href="#" className="w-10 h-10 bg-gray-200 hover:bg-blue-500 rounded-full flex items-center justify-center transition-colors group">
                  <Twitter className="w-5 h-5 text-gray-600 group-hover:text-white" />
                </a>
                <a href="#" className="w-10 h-10 bg-gray-200 hover:bg-blue-500 rounded-full flex items-center justify-center transition-colors group">
                  <Instagram className="w-5 h-5 text-gray-600 group-hover:text-white" />
                </a>
                <a href="#" className="w-10 h-10 bg-gray-200 hover:bg-blue-500 rounded-full flex items-center justify-center transition-colors group">
                  <Linkedin className="w-5 h-5 text-gray-600 group-hover:text-white" />
                </a>
              </div>
            </div>
            
            {/* Contact Form */}
            <Card className="border-0 shadow-xl bg-white">
              <CardHeader>
                <CardTitle className="text-2xl">Envíanos un mensaje</CardTitle>
                <CardDescription>
                  Completa el formulario y nos pondremos en contacto contigo lo antes posible.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nombre completo *
                      </label>
                      <Input
                        type="text"
                        name="nombre"
                        value={formData.nombre}
                        onChange={handleInputChange}
                        placeholder="Tu nombre"
                        required
                        className="h-12"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email *
                      </label>
                      <Input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="tu@email.com"
                        required
                        className="h-12"
                      />
                    </div>
                  </div>
                  
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Teléfono
                      </label>
                      <Input
                        type="tel"
                        name="telefono"
                        value={formData.telefono}
                        onChange={handleInputChange}
                        placeholder="+54 9 11..."
                        className="h-12"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Empresa
                      </label>
                      <Input
                        type="text"
                        name="empresa"
                        value={formData.empresa}
                        onChange={handleInputChange}
                        placeholder="Nombre de tu empresa"
                        className="h-12"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mensaje *
                    </label>
                    <Textarea
                      name="mensaje"
                      value={formData.mensaje}
                      onChange={handleInputChange}
                      placeholder="Contanos sobre tu proyecto o consulta..."
                      required
                      rows={5}
                      className="resize-none"
                    />
                  </div>
                  
                  {submitStatus === "success" && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                      ✓ ¡Mensaje enviado con éxito! Nos pondremos en contacto pronto.
                    </div>
                  )}
                  
                  <Button 
                    type="submit" 
                    size="lg"
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white h-12"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Enviando...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        Enviar Mensaje
                        <Send className="w-5 h-5" />
                      </span>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 lg:py-20 bg-gradient-to-r from-slate-900 to-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            ¿Listo para transformar tu empresa?
          </h2>
          <p className="text-lg text-gray-300 mb-8">
            Soluciones de software eficientes para llevar tu negocio al siguiente nivel.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-blue-500 hover:bg-blue-600 text-white px-8">
              Comenzar Ahora
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline" className="border-gray-500 text-white hover:bg-white/10 px-8">
              Agendar Llamada
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 lg:py-16 bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
            {/* Brand */}
            <div className="sm:col-span-2 lg:col-span-1">
              <a href="#" className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-xl">C</span>
                </div>
                <span className="text-xl font-bold text-gray-900">
                  code<span className="text-blue-500">Control</span>
                </span>
              </a>
              <p className="text-gray-600 mb-4">
                Soluciones de software eficientes para tu empresa.
              </p>
              <div className="flex gap-3">
                <a href="#" className="w-9 h-9 bg-gray-100 hover:bg-blue-500 rounded-full flex items-center justify-center transition-colors group">
                  <Twitter className="w-4 h-4 text-gray-600 group-hover:text-white" />
                </a>
                <a href="#" className="w-9 h-9 bg-gray-100 hover:bg-blue-500 rounded-full flex items-center justify-center transition-colors group">
                  <Instagram className="w-4 h-4 text-gray-600 group-hover:text-white" />
                </a>
                <a href="#" className="w-9 h-9 bg-gray-100 hover:bg-blue-500 rounded-full flex items-center justify-center transition-colors group">
                  <Linkedin className="w-4 h-4 text-gray-600 group-hover:text-white" />
                </a>
              </div>
            </div>
            
            {/* Links */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Nuestra App</h4>
              <ul className="space-y-3">
                <li><a href="#" className="text-gray-600 hover:text-blue-500 transition-colors">App</a></li>
                <li><a href="#" className="text-gray-600 hover:text-blue-500 transition-colors">Precios</a></li>
                <li><a href="#" className="text-gray-600 hover:text-blue-500 transition-colors">Ventajas</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Términos</h4>
              <ul className="space-y-3">
                <li><a href="#" className="text-gray-600 hover:text-blue-500 transition-colors">Términos y Condiciones</a></li>
                <li><a href="#" className="text-gray-600 hover:text-blue-500 transition-colors">Política de Privacidad</a></li>
                <li><a href="#" className="text-gray-600 hover:text-blue-500 transition-colors">Política de Reembolso</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Soporte</h4>
              <ul className="space-y-3">
                <li><a href="#" className="text-gray-600 hover:text-blue-500 transition-colors">Crear un ticket</a></li>
                <li><a href="#" className="text-gray-600 hover:text-blue-500 transition-colors">Términos de uso</a></li>
                <li><a href="#contacto" className="text-gray-600 hover:text-blue-500 transition-colors">Contacto</a></li>
              </ul>
            </div>
          </div>
          
          <div className="mt-12 pt-8 border-t border-gray-100 text-center">
            <p className="text-gray-500">
              © 2024 CodeControl. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
