import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@relaycore/design-system';
import { lightTheme } from '@relaycore/design-system';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { Home } from './pages/Home';
import { Pricing } from './pages/Pricing';
import { Documentation } from './pages/Documentation';
import { Blog } from './pages/Blog';
import { Contact } from './pages/Contact';
import styled from 'styled-components';

const AppContainer = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
`;

const Main = styled.main`
  flex: 1;
  margin-top: 80px; /* To account for the fixed header */
`;

const App: React.FC = () => {
  return (
    <ThemeProvider theme={lightTheme}>
      <AppContainer>
        <Router>
          <Header />
          <Main>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/docs" element={<Documentation />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/contact" element={<Contact />} />
            </Routes>
          </Main>
          <Footer />
        </Router>
      </AppContainer>
    </ThemeProvider>
  );
};

export default App;