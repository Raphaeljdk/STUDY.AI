'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Download, Type, Search, Sparkles } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface CoverPreset {
  id: string;
  name: string;
  category: string;
  gradient: string;
  pattern: string;
  textColor: string;
  accentColor: string;
}

function g(a: string, b: string, c: string, d = '135deg') {
  return `linear-gradient(${d}, ${a} 0%, ${b} 50%, ${c} 100%)`;
}
function g2(a: string, b: string, d = '135deg') {
  return `linear-gradient(${d}, ${a} 0%, ${b} 100%)`;
}

const COVERS: CoverPreset[] = [
  // ===== JAPONÊS (20) =====
  { id: 'washi', name: 'Washi Paper', category: 'Japonês', gradient: g2('#f5f0e8', '#e8dfd0'), pattern: 'zen', textColor: '#2c1810', accentColor: '#8B4513' },
  { id: 'sumi', name: 'Sumi Ink', category: 'Japonês', gradient: g2('#1a1a2e', '#16213e'), pattern: 'waves', textColor: '#e0d5c1', accentColor: '#c9b896' },
  { id: 'sakura', name: 'Sakura', category: 'Japonês', gradient: g('#fce4ec', '#f8bbd0', '#f48fb1'), pattern: 'sakura', textColor: '#880e4f', accentColor: '#e91e63' },
  { id: 'bamboo', name: 'Bamboo', category: 'Japonês', gradient: g('#1b5e20', '#2e7d32', '#4caf50'), pattern: 'bamboo', textColor: '#e8f5e9', accentColor: '#a5d6a7' },
  { id: 'kintsugi', name: 'Kintsugi', category: 'Japonês', gradient: g2('#2c1810', '#3e2723'), pattern: 'lines', textColor: '#ffd54f', accentColor: '#ffb300' },
  { id: 'ryoanji', name: 'Ryoanji', category: 'Japonês', gradient: g2('#d7ccc8', '#bcaaa4'), pattern: 'zen', textColor: '#424242', accentColor: '#757575' },
  { id: 'torii', name: 'Torii', category: 'Japonês', gradient: g('#c62828', '#b71c1c', '#8e0000'), pattern: 'zen', textColor: '#ffcdd2', accentColor: '#ff8a80' },
  { id: 'matcha', name: 'Matcha', category: 'Japonês', gradient: g('#689f38', '#558b2f', '#33691e'), pattern: 'dots', textColor: '#f1f8e9', accentColor: '#c5e1a5' },
  { id: 'umeshu', name: 'Umeshu', category: 'Japonês', gradient: g('#880e4f', '#ad1457', '#d81b60'), pattern: 'circles', textColor: '#fce4ec', accentColor: '#f48fb1' },
  { id: 'shoji', name: 'Shoji', category: 'Japonês', gradient: g2('#efebe9', '#d7ccc8'), pattern: 'grid', textColor: '#3e2723', accentColor: '#8d6e63' },
  { id: 'yukata', name: 'Yukata', category: 'Japonês', gradient: g('#e1bee7', '#ce93d8', '#ba68c8'), pattern: 'sakura', textColor: '#4a148c', accentColor: '#9c27b0' },
  { id: 'fuji', name: 'Fuji', category: 'Japonês', gradient: g('#5c6bc0', '#7986cb', '#9fa8da'), pattern: 'waves', textColor: '#e8eaf6', accentColor: '#c5cae9' },
  { id: 'nori', name: 'Nori', category: 'Japonês', gradient: g2('#1b1b2f', '#162447'), pattern: 'lines', textColor: '#a8dadc', accentColor: '#457b9d' },
  { id: 'sushi', name: 'Sushi', category: 'Japonês', gradient: g('#ff7043', '#ff5722', '#e64a19'), pattern: 'circles', textColor: '#fbe9e7', accentColor: '#ffab91' },
  { id: 'origami', name: 'Origami', category: 'Japonês', gradient: g('#fff176', '#ffee58', '#fdd835'), pattern: 'grid', textColor: '#f57f17', accentColor: '#f9a825' },
  { id: 'bonsai2', name: 'Bonsai', category: 'Japonês', gradient: g('#2e7d32', '#1b5e20', '#0d3b0d'), pattern: 'bamboo', textColor: '#a5d6a7', accentColor: '#66bb6a' },
  { id: 'enso', name: 'Enso', category: 'Japonês', gradient: g2('#fafafa', '#eeeeee'), pattern: 'zen', textColor: '#212121', accentColor: '#9e9e9e' },
  { id: 'koi', name: 'Koi', category: 'Japonês', gradient: g('#ff6f00', '#ff8f00', '#ffa000'), pattern: 'waves', textColor: '#fff8e1', accentColor: '#ffe082' },
  { id: 'yuzu', name: 'Yuzu', category: 'Japonês', gradient: g('#f9a825', '#f57f17', '#e65100'), pattern: 'dots', textColor: '#fffde7', accentColor: '#fff59d' },
  { id: 'shinkansen', name: 'Shinkansen', category: 'Japonês', gradient: g2('#263238', '#37474f'), pattern: 'lines', textColor: '#80cbc4', accentColor: '#4db6ac' },
  // ===== MINIMALISTA (15) =====
  { id: 'clean', name: 'Clean White', category: 'Minimalista', gradient: g2('#ffffff', '#f5f5f5'), pattern: 'dots', textColor: '#212121', accentColor: '#9e9e9e' },
  { id: 'noir', name: 'Noir', category: 'Minimalista', gradient: g2('#212121', '#424242'), pattern: 'grid', textColor: '#fafafa', accentColor: '#e0e0e0' },
  { id: 'cream', name: 'Cream', category: 'Minimalista', gradient: g2('#fff8e1', '#ffecb3'), pattern: 'none', textColor: '#5d4037', accentColor: '#a1887f' },
  { id: 'ivory', name: 'Ivory', category: 'Minimalista', gradient: g2('#fffff0', '#f5f5dc'), pattern: 'none', textColor: '#333', accentColor: '#999' },
  { id: 'slate', name: 'Slate', category: 'Minimalista', gradient: g2('#607d8b', '#455a64'), pattern: 'lines', textColor: '#cfd8dc', accentColor: '#90a4ae' },
  { id: 'pebble', name: 'Pebble', category: 'Minimalista', gradient: g2('#9e9e9e', '#757575'), pattern: 'dots', textColor: '#fafafa', accentColor: '#e0e0e0' },
  { id: 'sand', name: 'Sand', category: 'Minimalista', gradient: g2('#e8d5b7', '#d4b896'), pattern: 'none', textColor: '#4e342e', accentColor: '#8d6e63' },
  { id: 'snow', name: 'Snow', category: 'Minimalista', gradient: g2('#eceff1', '#cfd8dc'), pattern: 'dots', textColor: '#37474f', accentColor: '#78909c' },
  { id: 'charcoal', name: 'Charcoal', category: 'Minimalista', gradient: g2('#333', '#1a1a1a'), pattern: 'grid', textColor: '#eee', accentColor: '#888' },
  { id: 'linen', name: 'Linen', category: 'Minimalista', gradient: g2('#f5f0eb', '#e8e0d8'), pattern: 'lines', textColor: '#3e2723', accentColor: '#8d6e63' },
  { id: 'fog', name: 'Fog', category: 'Minimalista', gradient: g2('#cfd8dc', '#b0bec5'), pattern: 'none', textColor: '#263238', accentColor: '#546e7a' },
  { id: 'bone', name: 'Bone', category: 'Minimalista', gradient: g2('#e0d6c8', '#d1c4b0'), pattern: 'none', textColor: '#3e2723', accentColor: '#795548' },
  { id: 'ash', name: 'Ash', category: 'Minimalista', gradient: g2('#bdbdbd', '#9e9e9e'), pattern: 'grid', textColor: '#212121', accentColor: '#424242' },
  { id: 'pearl', name: 'Pearl', category: 'Minimalista', gradient: g2('#f8f8f8', '#e8e8e8'), pattern: 'dots', textColor: '#444', accentColor: '#aaa' },
  { id: 'graphite', name: 'Graphite', category: 'Minimalista', gradient: g2('#555', '#333'), pattern: 'lines', textColor: '#ddd', accentColor: '#999' },
  // ===== CORES VIVAS (25) =====
  { id: 'ocean', name: 'Ocean', category: 'Cores', gradient: g('#0d47a1', '#1976d2', '#42a5f5'), pattern: 'waves', textColor: '#e3f2fd', accentColor: '#90caf9' },
  { id: 'sunset', name: 'Sunset', category: 'Cores', gradient: g('#bf360c', '#e65100', '#ff9800'), pattern: 'circles', textColor: '#fff3e0', accentColor: '#ffb74d' },
  { id: 'lavender', name: 'Lavanda', category: 'Cores', gradient: g('#4a148c', '#7b1fa2', '#ab47bc'), pattern: 'circles', textColor: '#f3e5f5', accentColor: '#ce93d8' },
  { id: 'forest', name: 'Floresta', category: 'Cores', gradient: g('#1b5e20', '#33691e', '#689f38'), pattern: 'bamboo', textColor: '#f1f8e9', accentColor: '#aed581' },
  { id: 'midnight', name: 'Midnight', category: 'Cores', gradient: g('#0d1b2a', '#1b2838', '#2d4059'), pattern: 'dots', textColor: '#e0e1dd', accentColor: '#778da9' },
  { id: 'coral', name: 'Coral', category: 'Cores', gradient: g('#ff8a65', '#ff7043', '#f4511e'), pattern: 'sakura', textColor: '#fff3e0', accentColor: '#ffccbc' },
  { id: 'arctic', name: 'Arctic', category: 'Cores', gradient: g('#e0f7fa', '#b2ebf2', '#80deea'), pattern: 'waves', textColor: '#006064', accentColor: '#00acc1' },
  { id: 'cherry', name: 'Cherry', category: 'Cores', gradient: g('#c62828', '#d32f2f', '#ef5350'), pattern: 'dots', textColor: '#ffebee', accentColor: '#ef9a9a' },
  { id: 'emerald', name: 'Esmeralda', category: 'Cores', gradient: g('#004d40', '#00695c', '#00897b'), pattern: 'lines', textColor: '#e0f2f1', accentColor: '#80cbc4' },
  { id: 'amber', name: 'Amber', category: 'Cores', gradient: g('#e65100', '#ef6c00', '#f57c00'), pattern: 'circles', textColor: '#fff8e1', accentColor: '#ffca28' },
  { id: 'rose', name: 'Rose', category: 'Cores', gradient: g('#880e4f', '#ad1457', '#c2185b'), pattern: 'sakura', textColor: '#fce4ec', accentColor: '#f06292' },
  { id: 'teal', name: 'Teal', category: 'Cores', gradient: g('#004d40', '#00796b', '#009688'), pattern: 'waves', textColor: '#e0f2f1', accentColor: '#4db6ac' },
  { id: 'tangerine', name: 'Tangerina', category: 'Cores', gradient: g('#ef6c00', '#f57c00', '#fb8c00'), pattern: 'dots', textColor: '#fff3e0', accentColor: '#ffb74d' },
  { id: 'plum', name: 'Plum', category: 'Cores', gradient: g('#4a148c', '#6a1b9a', '#8e24aa'), pattern: 'zen', textColor: '#f3e5f5', accentColor: '#ba68c8' },
  { id: 'turquoise', name: 'Turquesa', category: 'Cores', gradient: g('#00695c', '#00897b', '#26a69a'), pattern: 'dots', textColor: '#e0f2f1', accentColor: '#80cbc4' },
  { id: 'ruby', name: 'Ruby', category: 'Cores', gradient: g('#b71c1c', '#c62828', '#e53935'), pattern: 'lines', textColor: '#ffebee', accentColor: '#ef9a9a' },
  { id: 'jade', name: 'Jade', category: 'Cores', gradient: g('#2e7d32', '#388e3c', '#43a047'), pattern: 'bamboo', textColor: '#e8f5e9', accentColor: '#81c784' },
  { id: 'sapphire', name: 'Sapphire', category: 'Cores', gradient: g('#1a237e', '#283593', '#3949ab'), pattern: 'circles', textColor: '#e8eaf6', accentColor: '#9fa8da' },
  { id: 'copper', name: 'Cobre', category: 'Cores', gradient: g('#bf360c', '#d84315', '#e64a19'), pattern: 'lines', textColor: '#fbe9e7', accentColor: '#ff8a65' },
  { id: 'mint', name: 'Menta', category: 'Cores', gradient: g('#00bfa5', '#1de9b6', '#64ffda'), pattern: 'dots', textColor: '#004d40', accentColor: '#a7ffeb' },
  { id: 'crimson', name: 'Crimson', category: 'Cores', gradient: g('#880e4f', '#b71c1c', '#d32f2f'), pattern: 'sakura', textColor: '#fce4ec', accentColor: '#f48fb1' },
  { id: 'olive', name: 'Oliva', category: 'Cores', gradient: g('#558b2f', '#689f38', '#7cb342'), pattern: 'bamboo', textColor: '#f1f8e9', accentColor: '#aed581' },
  { id: 'magenta', name: 'Magenta', category: 'Cores', gradient: g('#ad1457', '#c2185b', '#d81b60'), pattern: 'circles', textColor: '#fce4ec', accentColor: '#f06292' },
  { id: 'indigo', name: 'Indigo', category: 'Cores', gradient: g('#1a237e', '#303f9f', '#5c6bc0'), pattern: 'waves', textColor: '#e8eaf6', accentColor: '#9fa8da' },
  { id: 'bronze', name: 'Bronze', category: 'Cores', gradient: g('#4e342e', '#5d4037', '#6d4c41'), pattern: 'lines', textColor: '#d7ccc8', accentColor: '#bcaaa4' },
  // ===== ACADÊMICO (15) =====
  { id: 'classic', name: 'Classico', category: 'Acadêmico', gradient: g2('#3e2723', '#5d4037'), pattern: 'lines', textColor: '#efebe9', accentColor: '#bcaaa4' },
  { id: 'college', name: 'College', category: 'Acadêmico', gradient: g2('#b71c1c', '#c62828'), pattern: 'grid', textColor: '#ffffff', accentColor: '#ef9a9a' },
  { id: 'oxford', name: 'Oxford', category: 'Acadêmico', gradient: g2('#1b3a4b', '#274c5b'), pattern: 'lines', textColor: '#cfd8dc', accentColor: '#90a4ae' },
  { id: 'harvard', name: 'Harvard', category: 'Acadêmico', gradient: g2('#880e4f', '#a31545'), pattern: 'grid', textColor: '#fce4ec', accentColor: '#f48fb1' },
  { id: 'yale', name: 'Yale', category: 'Acadêmico', gradient: g2('#00356b', '#004f9a'), pattern: 'lines', textColor: '#c5cae9', accentColor: '#7986cb' },
  { id: 'cambridge', name: 'Cambridge', category: 'Acadêmico', gradient: g2('#a3be8c', '#8fbc6f'), pattern: 'dots', textColor: '#1b3a1b', accentColor: '#6d9b4a' },
  { id: 'stanford', name: 'Stanford', category: 'Acadêmico', gradient: g2('#8c1515', '#be2e2e'), pattern: 'lines', textColor: '#fce4ec', accentColor: '#ef9a9a' },
  { id: 'mit', name: 'MIT', category: 'Acadêmico', gradient: g2('#a31f34', '#c32d45'), pattern: 'grid', textColor: '#fce4ec', accentColor: '#ef9a9a' },
  { id: 'notebook1', name: 'Caderno Azul', category: 'Acadêmico', gradient: g2('#1565c0', '#1976d2'), pattern: 'lines', textColor: '#e3f2fd', accentColor: '#90caf9' },
  { id: 'notebook2', name: 'Caderno Verde', category: 'Acadêmico', gradient: g2('#2e7d32', '#388e3c'), pattern: 'lines', textColor: '#e8f5e9', accentColor: '#81c784' },
  { id: 'notebook3', name: 'Caderno Vermelho', category: 'Acadêmico', gradient: g2('#c62828', '#d32f2f'), pattern: 'lines', textColor: '#ffebee', accentColor: '#ef9a9a' },
  { id: 'notebook4', name: 'Caderno Preto', category: 'Acadêmico', gradient: g2('#212121', '#424242'), pattern: 'lines', textColor: '#fafafa', accentColor: '#e0e0e0' },
  { id: 'lab', name: 'Laboratorio', category: 'Acadêmico', gradient: g2('#00695c', '#00897b'), pattern: 'grid', textColor: '#e0f2f1', accentColor: '#80cbc4' },
  { id: 'library', name: 'Biblioteca', category: 'Acadêmico', gradient: g2('#4e342e', '#6d4c41'), pattern: 'lines', textColor: '#d7ccc8', accentColor: '#a1887f' },
  { id: 'thesis', name: 'Tese', category: 'Acadêmico', gradient: g2('#1a1a2e', '#16213e'), pattern: 'grid', textColor: '#c9b896', accentColor: '#8d7b6a' },
  // ===== NATUREZA (15) =====
  { id: 'aurora', name: 'Aurora', category: 'Natureza', gradient: g('#00e676', '#00bfa5', '#2979ff'), pattern: 'waves', textColor: '#ffffff', accentColor: '#b2ff59' },
  { id: 'desert', name: 'Deserto', category: 'Natureza', gradient: g('#e65100', '#f57c00', '#ffb74d'), pattern: 'dots', textColor: '#fff3e0', accentColor: '#ffe0b2' },
  { id: 'jungle', name: 'Selva', category: 'Natureza', gradient: g('#1b5e20', '#00695c', '#004d40'), pattern: 'bamboo', textColor: '#a5d6a7', accentColor: '#4db6ac' },
  { id: 'volcano', name: 'Vulcao', category: 'Natureza', gradient: g('#b71c1c', '#e65100', '#f57c00'), pattern: 'circles', textColor: '#fff3e0', accentColor: '#ffab91' },
  { id: 'glacier', name: 'Geleira', category: 'Natureza', gradient: g('#e3f2fd', '#bbdefb', '#90caf9'), pattern: 'waves', textColor: '#0d47a1', accentColor: '#42a5f5' },
  { id: 'canyon', name: 'Canyon', category: 'Natureza', gradient: g('#bf360c', '#8d6e63', '#795548'), pattern: 'lines', textColor: '#fbe9e7', accentColor: '#bcaaa4' },
  { id: 'tundra', name: 'Tundra', category: 'Natureza', gradient: g('#eceff1', '#cfd8dc', '#b0bec5'), pattern: 'dots', textColor: '#37474f', accentColor: '#78909c' },
  { id: 'savanna', name: 'Savana', category: 'Natureza', gradient: g('#f9a825', '#f57f17', '#e65100'), pattern: 'lines', textColor: '#3e2723', accentColor: '#8d6e63' },
  { id: 'reef', name: 'Recife', category: 'Natureza', gradient: g('#0097a7', '#00acc1', '#26c6da'), pattern: 'sakura', textColor: '#e0f7fa', accentColor: '#80deea' },
  { id: 'meadow', name: 'Prado', category: 'Natureza', gradient: g('#7cb342', '#9ccc65', '#c5e1a5'), pattern: 'dots', textColor: '#1b5e20', accentColor: '#558b2f' },
  { id: 'storm', name: 'Tempestade', category: 'Natureza', gradient: g('#263238', '#37474f', '#546e7a'), pattern: 'waves', textColor: '#b0bec5', accentColor: '#78909c' },
  { id: 'dawn', name: 'Aurora', category: 'Natureza', gradient: g('#ff6f00', '#ff8f00', '#ffd54f'), pattern: 'waves', textColor: '#fff8e1', accentColor: '#ffe082' },
  { id: 'autumn', name: 'Outono', category: 'Natureza', gradient: g('#e65100', '#f57c00', '#ff9800'), pattern: 'sakura', textColor: '#fff3e0', accentColor: '#ffcc80' },
  { id: 'spring', name: 'Primavera', category: 'Natureza', gradient: g('#66bb6a', '#81c784', '#a5d6a7'), pattern: 'sakura', textColor: '#1b5e20', accentColor: '#4caf50' },
  { id: 'night-sky', name: 'Ceu Noturno', category: 'Natureza', gradient: g('#0d1b2a', '#1b2838', '#1b3a4b'), pattern: 'dots', textColor: '#e0e1dd', accentColor: '#778da9' },
  // ===== CRIATIVO (15) =====
  { id: 'neon', name: 'Neon', category: 'Criativo', gradient: g2('#0a0a0a', '#1a1a2e'), pattern: 'grid', textColor: '#00ff88', accentColor: '#ff00ff' },
  { id: 'retro', name: 'Retro', category: 'Criativo', gradient: g('#ff6b6b', '#feca57', '#48dbfb'), pattern: 'circles', textColor: '#2c3e50', accentColor: '#636e72' },
  { id: 'synthwave', name: 'Synthwave', category: 'Criativo', gradient: g('#2d1b69', '#11001c', '#0d0221'), pattern: 'waves', textColor: '#ff71ce', accentColor: '#01cdfe' },
  { id: 'pixel', name: 'Pixel', category: 'Criativo', gradient: g2('#1a1c2c', '#262b44'), pattern: 'grid', textColor: '#f4f4f4', accentColor: '#94b0c2' },
  { id: 'pastel', name: 'Pastel', category: 'Criativo', gradient: g('#ffecd2', '#fcb69f', '#a1c4fd'), pattern: 'dots', textColor: '#333', accentColor: '#764ba2' },
  { id: 'galaxy', name: 'Galaxia', category: 'Criativo', gradient: g('#0f0c29', '#302b63', '#24243e'), pattern: 'dots', textColor: '#e8daef', accentColor: '#af7ac5' },
  { id: 'candy', name: 'Candy', category: 'Criativo', gradient: g('#ff6b81', '#feca57', '#ff9ff3'), pattern: 'sakura', textColor: '#2f3542', accentColor: '#ff6b81' },
  { id: 'holographic', name: 'Holografico', category: 'Criativo', gradient: g('#a18cd1', '#fbc2eb', '#a6c1ee'), pattern: 'circles', textColor: '#333', accentColor: '#a18cd1' },
  { id: 'vaporwave', name: 'Vaporwave', category: 'Criativo', gradient: g('#ff71ce', '#01cdfe', '#05ffa1'), pattern: 'grid', textColor: '#2d1b69', accentColor: '#ff71ce' },
  { id: 'cyberpunk', name: 'Cyberpunk', category: 'Criativo', gradient: g2('#0d0221', '#150535'), pattern: 'grid', textColor: '#00fff5', accentColor: '#ff00ff' },
  { id: 'dreamy', name: 'Sonho', category: 'Criativo', gradient: g('#e0c3fc', '#8ec5fc', '#e0c3fc'), pattern: 'sakura', textColor: '#2c3e50', accentColor: '#6c5ce7' },
  { id: 'sunset2', name: 'Por do Sol', category: 'Criativo', gradient: g('#ee5a24', '#f0932b', '#f6e58d'), pattern: 'waves', textColor: '#2c3e50', accentColor: '#eb4d4b' },
  { id: 'cosmic', name: 'Cosmico', category: 'Criativo', gradient: g('#141e30', '#243b55', '#141e30'), pattern: 'dots', textColor: '#e8daef', accentColor: '#85c1e9' },
  { id: 'bubblegum', name: 'Bubblegum', category: 'Criativo', gradient: g('#ff6b81', '#ff9ff3', '#feca57'), pattern: 'sakura', textColor: '#2f3542', accentColor: '#ff6b81' },
  { id: 'electric', name: 'Eletrico', category: 'Criativo', gradient: g2('#0a0a2a', '#1a1a4a'), pattern: 'lines', textColor: '#00d4ff', accentColor: '#ff00ff' },
  // ===== PROFISSIONAL (15) =====
  { id: 'corporate', name: 'Corporativo', category: 'Profissional', gradient: g2('#1a237e', '#283593'), pattern: 'lines', textColor: '#c5cae9', accentColor: '#7986cb' },
  { id: 'executive', name: 'Executivo', category: 'Profissional', gradient: g2('#263238', '#37474f'), pattern: 'grid', textColor: '#b0bec5', accentColor: '#78909c' },
  { id: 'lawyer', name: 'Advocacia', category: 'Profissional', gradient: g2('#1b3a4b', '#2c5364'), pattern: 'lines', textColor: '#cfd8dc', accentColor: '#90a4ae' },
  { id: 'medical', name: 'Medicina', category: 'Profissional', gradient: g2('#00695c', '#00897b'), pattern: 'lines', textColor: '#b2dfdb', accentColor: '#4db6ac' },
  { id: 'engineering', name: 'Engenharia', category: 'Profissional', gradient: g2('#37474f', '#455a64'), pattern: 'grid', textColor: '#cfd8dc', accentColor: '#90a4ae' },
  { id: 'finance', name: 'Financas', category: 'Profissional', gradient: g2('#004d40', '#00695c'), pattern: 'lines', textColor: '#a5d6a7', accentColor: '#66bb6a' },
  { id: 'tech', name: 'Tecnologia', category: 'Profissional', gradient: g2('#0d47a1', '#1565c0'), pattern: 'grid', textColor: '#90caf9', accentColor: '#42a5f5' },
  { id: 'design', name: 'Design', category: 'Profissional', gradient: g2('#4a148c', '#6a1b9a'), pattern: 'dots', textColor: '#ce93d8', accentColor: '#ab47bc' },
  { id: 'architecture', name: 'Arquitetura', category: 'Profissional', gradient: g2('#3e2723', '#5d4037'), pattern: 'lines', textColor: '#bcaaa4', accentColor: '#8d6e63' },
  { id: 'science', name: 'Ciencia', category: 'Profissional', gradient: g2('#01579b', '#0277bd'), pattern: 'grid', textColor: '#81d4fa', accentColor: '#29b6f6' },
  { id: 'business', name: 'Negocios', category: 'Profissional', gradient: g2('#1a1a2e', '#16213e'), pattern: 'lines', textColor: '#a8dadc', accentColor: '#457b9d' },
  { id: 'startup', name: 'Startup', category: 'Profissional', gradient: g('#6c5ce7', '#a29bfe', '#dfe6e9'), pattern: 'dots', textColor: '#2d3436', accentColor: '#6c5ce7' },
  { id: 'consulting', name: 'Consultoria', category: 'Profissional', gradient: g2('#263238', '#455a64'), pattern: 'lines', textColor: '#b0bec5', accentColor: '#78909c' },
  { id: 'marketing', name: 'Marketing', category: 'Profissional', gradient: g('#e91e63', '#f06292', '#f8bbd0'), pattern: 'circles', textColor: '#880e4f', accentColor: '#ec407a' },
  { id: 'journalism', name: 'Jornalismo', category: 'Profissional', gradient: g2('#212121', '#424242'), pattern: 'lines', textColor: '#e0e0e0', accentColor: '#9e9e9e' },
];

const CATEGORIES = ['Todos', 'Japonês', 'Minimalista', 'Cores', 'Acadêmico', 'Natureza', 'Criativo', 'Profissional'];

export function CoversView() {
  const [selectedCover, setSelectedCover] = useState<CoverPreset>(COVERS[0]);
  const [title, setTitle] = useState('Meu Caderno');
  const [subtitle, setSubtitle] = useState('');
  const [category, setCategory] = useState('Todos');
  const [search, setSearch] = useState('');

  const filteredCovers = useMemo(() => {
    return COVERS.filter(c => {
      const matchCat = category === 'Todos' || c.category === category;
      const matchSearch = !search || c.name.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [category, search]);

  const downloadCover = () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    canvas.width = 1200; canvas.height = 1600;
    // Background
    const colors = extractGradientColors(selectedCover.gradient);
    const grd = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    grd.addColorStop(0, colors[0]); grd.addColorStop(0.5, colors[1] || colors[0]); grd.addColorStop(1, colors[2] || colors[1] || colors[0]);
    ctx.fillStyle = grd; ctx.fillRect(0, 0, 1200, 1600);
    // Pattern
    drawPattern(ctx, selectedCover.pattern, selectedCover.accentColor);
    // Border
    ctx.strokeStyle = selectedCover.accentColor + '80'; ctx.lineWidth = 3;
    ctx.strokeRect(35, 35, 1130, 1530);
    // Title
    ctx.fillStyle = selectedCover.textColor;
    ctx.font = 'bold 64px Georgia, serif'; ctx.textAlign = 'center';
    ctx.fillText(title, 600, 780);
    // Subtitle
    if (subtitle) {
      ctx.font = '32px sans-serif'; ctx.globalAlpha = 0.7;
      ctx.fillText(subtitle, 600, 830); ctx.globalAlpha = 1;
    }
    // Download
    const link = document.createElement('a');
    link.download = `capa-${title.toLowerCase().replace(/\s+/g, '-')}.png`;
    link.href = canvas.toDataURL('image/png'); link.click();
    toast({ title: 'Capa baixada!', description: 'Sua capa de caderno foi salva.' });
  };

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--ws-text-primary)]" style={{ fontFamily: 'var(--font-serif-jp), serif' }}>
          Capas de Caderno
        </h1>
        <p className="mt-1 text-sm text-[var(--ws-text-tertiary)]">
          {COVERS.length} designs disponiveis — Crie capas personalizadas
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Preview */}
        <div className="flex flex-col gap-4">
          <div
            className="relative mx-auto w-full max-w-[280px] overflow-hidden rounded-lg shadow-xl"
            style={{ aspectRatio: '3/4' }}
          >
            <div className="absolute inset-0" style={{ background: selectedCover.gradient }} />
            <div className="absolute inset-0 opacity-20">
              <PatternSVG pattern={selectedCover.pattern} color={selectedCover.accentColor} />
            </div>
            <div className="absolute inset-3 rounded-sm border-2" style={{ borderColor: selectedCover.accentColor + '60' }} />
            <div className="absolute inset-0 flex flex-col items-center justify-center p-8">
              <h2 className="text-center text-2xl font-bold leading-tight" style={{ color: selectedCover.textColor, fontFamily: 'var(--font-serif-jp), serif' }}>
                {title || 'Titulo do Caderno'}
              </h2>
              {subtitle && (
                <p className="mt-2 text-center text-sm opacity-70" style={{ color: selectedCover.textColor }}>{subtitle}</p>
              )}
            </div>
          </div>
          <button onClick={downloadCover} className="flex items-center justify-center gap-2 rounded-ws-button bg-[var(--ws-accent)] px-6 py-3 text-sm font-medium text-white transition-all hover:opacity-90 active:scale-[0.98]">
            <Download size={16} /> Baixar Capa PNG
          </button>
          <div className="flex flex-col gap-3 rounded-lg border border-[var(--ws-glass-border)] bg-[var(--ws-surface)] p-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-[var(--ws-text-primary)]"><Type size={14} /> Personalizar</h3>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Titulo do caderno"
              className="w-full rounded-ws-input border border-[var(--ws-glass-border)] bg-[var(--ws-bg)] px-3 py-2 text-sm text-[var(--ws-text-primary)] placeholder:text-[var(--ws-text-tertiary)] focus:border-[var(--ws-accent)] focus:outline-none" />
            <input type="text" value={subtitle} onChange={e => setSubtitle(e.target.value)} placeholder="Subtitulo (opcional)"
              className="w-full rounded-ws-input border border-[var(--ws-glass-border)] bg-[var(--ws-bg)] px-3 py-2 text-sm text-[var(--ws-text-primary)] placeholder:text-[var(--ws-text-tertiary)] focus:border-[var(--ws-accent)] focus:outline-none" />
          </div>
        </div>

        {/* Grid */}
        <div className="flex flex-col gap-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ws-text-tertiary)]" />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar capa..."
                className="w-full rounded-ws-input border border-[var(--ws-glass-border)] bg-[var(--ws-bg)] py-2 pl-9 pr-3 text-sm text-[var(--ws-text-primary)] placeholder:text-[var(--ws-text-tertiary)] focus:border-[var(--ws-accent)] focus:outline-none" />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(cat => (
              <button key={cat} onClick={() => setCategory(cat)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${category === cat ? 'bg-[var(--ws-accent)] text-white' : 'bg-[var(--ws-surface)] text-[var(--ws-text-secondary)] hover:bg-[color-mix(in_srgb,var(--ws-accent)_10%,transparent)]'}`}>
                {cat} ({cat === 'Todos' ? COVERS.length : COVERS.filter(c => c.category === cat).length})
              </button>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-3 max-h-[500px] overflow-y-auto pr-1">
            {filteredCovers.map((cover) => (
              <motion.button key={cover.id} onClick={() => setSelectedCover(cover)} whileTap={{ scale: 0.95 }}
                className={`group relative aspect-[3/4] overflow-hidden rounded-lg border-2 transition-all ${selectedCover.id === cover.id ? 'border-[var(--ws-accent)] shadow-md' : 'border-transparent hover:border-[var(--ws-glass-border)]'}`}>
                <div className="absolute inset-0" style={{ background: cover.gradient }} />
                <div className="absolute inset-0 opacity-15"><PatternSVG pattern={cover.pattern} color={cover.accentColor} /></div>
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/50 to-transparent p-2">
                  <p className="text-[10px] font-medium text-white truncate">{cover.name}</p>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function PatternSVG({ pattern, color }: { pattern: string; color: string }) {
  const id = Math.random().toString(36).slice(2, 8);
  const p: Record<string, React.ReactNode> = {
    none: null,
    grid: <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg"><defs><pattern id={id} width="40" height="40" patternUnits="userSpaceOnUse"><path d="M 40 0 L 0 0 0 40" fill="none" stroke={color} strokeWidth="1" /></pattern></defs><rect width="100%" height="100%" fill={`url(#${id})`} /></svg>,
    dots: <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg"><defs><pattern id={id} width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="10" cy="10" r="2" fill={color} /></pattern></defs><rect width="100%" height="100%" fill={`url(#${id})`} /></svg>,
    lines: <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg"><defs><pattern id={id} width="100%" height="20" patternUnits="userSpaceOnUse"><line x1="0" y1="10" x2="100%" y2="10" stroke={color} strokeWidth="1" /></pattern></defs><rect width="100%" height="100%" fill={`url(#${id})`} /></svg>,
    waves: <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg"><defs><pattern id={id} width="100" height="40" patternUnits="userSpaceOnUse"><path d="M0 20 Q25 10 50 20 T100 20" fill="none" stroke={color} strokeWidth="1.5" /></pattern></defs><rect width="100%" height="100%" fill={`url(#${id})`} /></svg>,
    circles: <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg"><defs><pattern id={id} width="60" height="60" patternUnits="userSpaceOnUse"><circle cx="30" cy="30" r="20" fill="none" stroke={color} strokeWidth="1" /></pattern></defs><rect width="100%" height="100%" fill={`url(#${id})`} /></svg>,
    zen: <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg"><circle cx="50%" cy="50%" r="30%" fill="none" stroke={color} strokeWidth="2" opacity="0.5" /><circle cx="50%" cy="50%" r="15%" fill="none" stroke={color} strokeWidth="1" opacity="0.3" /></svg>,
    sakura: <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg"><defs><pattern id={id} width="80" height="80" patternUnits="userSpaceOnUse"><path d="M40 10 Q45 25 40 35 Q35 25 40 10Z" fill={color} opacity="0.6" /><path d="M20 50 Q30 45 35 50 Q30 55 20 50Z" fill={color} opacity="0.4" /></pattern></defs><rect width="100%" height="100%" fill={`url(#${id})`} /></svg>,
    bamboo: <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg"><defs><pattern id={id} width="60" height="100" patternUnits="userSpaceOnUse"><line x1="20" y1="0" x2="20" y2="100" stroke={color} strokeWidth="3" /><line x1="50" y1="0" x2="50" y2="100" stroke={color} strokeWidth="2" opacity="0.5" /></pattern></defs><rect width="100%" height="100%" fill={`url(#${id})`} /></svg>,
  };
  return <>{p[pattern] || null}</>;
}

function extractGradientColors(gradient: string): string[] {
  const m = gradient.match(/#[0-9a-fA-F]{6}/g);
  return m ? m : ['#333333', '#666666', '#999999'];
}

function drawPattern(ctx: CanvasRenderingContext2D, pattern: string, color: string) {
  ctx.save(); ctx.strokeStyle = color; ctx.fillStyle = color; ctx.globalAlpha = 0.15;
  const w = 1200, h = 1600;
  switch (pattern) {
    case 'grid': ctx.lineWidth = 1; for (let x = 0; x <= w; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); } for (let y = 0; y <= h; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); } break;
    case 'dots': for (let x = 20; x <= w; x += 20) for (let y = 20; y <= h; y += 20) { ctx.beginPath(); ctx.arc(x, y, 2, 0, Math.PI * 2); ctx.fill(); } break;
    case 'lines': ctx.lineWidth = 1; for (let y = 20; y <= h; y += 20) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); } break;
    case 'waves': ctx.lineWidth = 1.5; for (let y = 20; y <= h; y += 40) { ctx.beginPath(); for (let x = 0; x <= w; x += 5) ctx.lineTo(x, y + Math.sin(x * 0.05) * 10); ctx.stroke(); } break;
    case 'zen': ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(600, 800, 300, 0, Math.PI * 2); ctx.stroke(); ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(600, 800, 150, 0, Math.PI * 2); ctx.stroke(); break;
    case 'sakura': { ctx.globalAlpha = 0.2; const pos = [[w*0.3,h*0.2],[w*0.7,h*0.15],[w*0.15,h*0.5],[w*0.8,h*0.45],[w*0.5,h*0.7],[w*0.2,h*0.8],[w*0.75,h*0.8]]; pos.forEach(([px,py]) => { for (let i = 0; i < 5; i++) { const a = (i * Math.PI * 2) / 5; ctx.beginPath(); ctx.ellipse(px + Math.cos(a) * 12, py + Math.sin(a) * 12, 12, 6, a, 0, Math.PI * 2); ctx.fill(); } }); break; }
    default: break;
  }
  ctx.restore();
}
