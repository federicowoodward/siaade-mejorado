import { definePreset } from '@primeuix/themes';
import Lara from '@primeuix/themes/lara';

const MyPreset = definePreset(Lara, {
  primitive: {
    'mineral-green': {
      50:  '#f5f8f6',
      100: '#dee9e5',
      200: '#bcd3c9',
      300: '#93b5a8',
      400: '#6d9487',
      500: '#527a6d',
      600: '#46695f',
      700: '#364f48',
      800: '#2e413b',
      900: '#293834',
      950: '#141f1c',
    },
  },

  semantic: {
    primary: {
      50:  '{mineral-green.50}',
      100: '{mineral-green.100}',
      200: '{mineral-green.200}',
      300: '{mineral-green.300}',
      400: '{mineral-green.400}',
      500: '{mineral-green.500}',
      600: '{mineral-green.600}',
      700: '{mineral-green.700}',
      800: '{mineral-green.800}',
      900: '{mineral-green.900}',
      950: '{mineral-green.950}',
    },
  },
});

export default MyPreset;
