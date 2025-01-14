import styled, { keyframes } from 'styled-components'

// animate slide in from bottom
export const SlideIn = keyframes`
    from {
        transform: translateY(100%);
    }
    to {
        transform: translateY(0);
    }
    
`

export const Banner = styled.div`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;

  background-color: var(--md-sys-color-on-primary);

  display: flex;
  gap: 32px;

  align-items: center;
  justify-content: center;

  padding: 8px;
  margin: 0;

  animation: ${SlideIn} 0.5s ease-in-out;
  z-index: 500;
  box-shadow: 0px -5px 10px 0px rgb(0 0 0 / 30%);
`
