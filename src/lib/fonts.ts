import { ABeeZee, Aclonica } from 'next/font/google'

export const abeezee = ABeeZee({
  subsets: ['latin'],
  weight: ['400'],
  style: ['normal', 'italic'],
  variable: '--font-abeezee',
  display: 'swap',
})

export const aclonica = Aclonica({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-aclonica',
  display: 'swap',
})
