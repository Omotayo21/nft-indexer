import { useState } from 'react';
import { Alchemy, Network } from 'alchemy-sdk';
import {
  Box,
  Button,
  Input,
  VStack,
  HStack,
  Text,
  Image,
  Card,
  CardBody,
  Heading,
  Spinner,
  Alert,
  AlertIcon,
  Container,
  SimpleGrid,
  Flex,
  Badge,
  Tooltip,
  useToast,
} from '@chakra-ui/react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';

function App() {
  const [userAddress, setUserAddress] = useState('');
  const [results, setResults] = useState([]);
  const [hasQueried, setHasQueried] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { address, isConnected } = useAccount();
  const toast = useToast();

  const alchemy = new Alchemy({
    apiKey: import.meta.env.VITE_ALCHEMY_API_KEY,
    network: Network.ETH_MAINNET,
  });

  async function resolveAddressOrENS(input) {
    if (input.endsWith('.eth')) {
      try {
        const resolvedAddress = await alchemy.core.resolveName(input);
        if (resolvedAddress) {
          toast({
            title: 'ENS Resolved!',
            description: `${input} → ${resolvedAddress}`,
            status: 'success',
            duration: 3000,
          });
          return resolvedAddress;
        } else {
          throw new Error('ENS name not found');
        }
      } catch (err) {
        toast({
          title: 'ENS Resolution Failed',
          description: 'Could not resolve ENS name',
          status: 'error',
          duration: 3000,
        });
        return null;
      }
    }
    
    return input;
  }

  async function getTokenBalance(addressToQuery) {
    const targetAddress = addressToQuery || userAddress;
    
    if (!targetAddress) {
      setError('Please enter an address or connect wallet!');
      return;
    }

    setLoading(true);
    setError('');
    setResults([]);

    try {
      const resolvedAddress = await resolveAddressOrENS(targetAddress);
      if (!resolvedAddress) {
        setLoading(false);
        return;
      }

      if (!/^0x[a-fA-F0-9]{40}$/.test(resolvedAddress)) {
        throw new Error('Invalid Ethereum address format');
      }

      const data = await alchemy.core.getTokenBalances(resolvedAddress);

      const nonZeroBalances = data.tokenBalances.filter((token) => {
        return token.tokenBalance !== '0' && token.tokenBalance !== '0x0';
      });

      if (nonZeroBalances.length === 0) {
        setHasQueried(true);
        setResults([]);
        setLoading(false);
        return;
      }

      const tokensWithMetadata = await Promise.all(
        nonZeroBalances.map(async (token) => {
          try {
            const metadata = await alchemy.core.getTokenMetadata(
              token.contractAddress
            );

            const balance = 
              parseInt(token.tokenBalance) / 
              Math.pow(10, metadata.decimals || 18);

            return {
              name: metadata.name || 'Unknown Token',
              symbol: metadata.symbol || '???',
              logo: metadata.logo || null,
              balance: balance.toFixed(4),
              contractAddress: token.contractAddress,
              decimals: metadata.decimals,
            };
          } catch (err) {
            console.error('Error fetching metadata:', err);
            return null;
          }
        })
      );

      const validTokens = tokensWithMetadata.filter(t => t !== null);

      setResults(validTokens);
      setHasQueried(true);
      
      toast({
        title: 'Success!',
        description: `Found ${validTokens.length} tokens`,
        status: 'success',
        duration: 2000,
      });
      
    } catch (err) {
      setError(err.message || 'Error fetching tokens. Check address and try again.');
      console.error(err);
      toast({
        title: 'Error',
        description: 'Failed to fetch tokens',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  }

  function checkMyWallet() {
    if (isConnected && address) {
      setUserAddress(address);
      getTokenBalance(address);
    } else {
      toast({
        title: 'Wallet Not Connected',
        description: 'Please connect your wallet first',
        status: 'warning',
        duration: 2000,
      });
    }
  }

  return (
    <Container maxW="container.xl" py={10}>
      <VStack spacing={8}>
        <Heading size="2xl" bgGradient="linear(to-r, blue.400, black)" bgClip="text">
           ERC-20 Token Indexer
        </Heading>
        <Text fontSize="lg" color="gray.600" textAlign="center">
          Enter any wallet address (or ENS name!) to see all ERC-20 tokens
        </Text>

        <ConnectButton />

        <VStack width="100%" spacing={4}>
          <HStack width="100%">
            <Input
              placeholder="Enter address or ENS name (vitalik.eth)"
              value={userAddress}
              onChange={(e) => setUserAddress(e.target.value)}
              size="lg"
              onKeyPress={(e) => {
                if (e.key === 'Enter') getTokenBalance();
              }}
            />
            <Button
              colorScheme="blue"
              size="lg"
              onClick={() => getTokenBalance()}
              isLoading={loading}
              loadingText="Searching..."
            >
              Search
            </Button>
          </HStack>
          
          {isConnected && (
            <Button
              colorScheme="purple"
              size="md"
              onClick={checkMyWallet}
              width="100%"
            >
              🔍 Check My Wallet
            </Button>
          )}
        </VStack>

        {error && (
          <Alert status="error" borderRadius="md">
            <AlertIcon />
            {error}
          </Alert>
        )}

        {loading && (
          <VStack py={10}>
            <Spinner size="xl" color="blue.500" thickness="4px" />
            <Text fontSize="lg">Fetching tokens...</Text>
            <Text fontSize="sm" color="gray.500">This may take a few seconds</Text>
          </VStack>
        )}

        {hasQueried && !loading && (
          <Box width="100%">
            <Flex justify="space-between" align="center" mb={6}>
              <Heading size="lg">
                {results.length > 0 ? `Found ${results.length} Tokens` : 'No Tokens Found'}
              </Heading>
              {results.length > 0 && (
                <Badge colorScheme="green" fontSize="md" p={2}>
                  Total: {results.length}
                </Badge>
              )}
            </Flex>

            {results.length === 0 ? (
              <Alert status="info">
                <AlertIcon />
                No tokens found for this address. They might not hold any ERC-20 tokens!
              </Alert>
            ) : (
              <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                {results.map((token, index) => (
                  <Card 
                    key={index}
                    _hover={{ 
                      transform: 'translateY(-4px)', 
                      shadow: 'xl',
                      transition: 'all 0.2s'
                    }}
                    cursor="pointer"
                    onClick={() => {
                      window.open(
                        `https://etherscan.io/token/${token.contractAddress}`,
                        '_blank'
                      );
                    }}
                  >
                    <CardBody>
                      <HStack spacing={4}>
                        {token.logo ? (
                          <Image
                            src={token.logo}
                            alt={token.name}
                            boxSize="50px"
                            borderRadius="full"
                            fallbackSrc="https://via.placeholder.com/50"
                          />
                        ) : (
                          <Flex
                            boxSize="50px"
                            bgGradient="linear(to-r, blue.400, purple.500)"
                            borderRadius="full"
                            align="center"
                            justify="center"
                            color="white"
                            fontWeight="bold"
                          >
                            {token.symbol?.charAt(0) || '?'}
                          </Flex>
                        )}
                        
                        <VStack align="start" spacing={1} flex={1}>
                          <Tooltip label={token.name}>
                            <Text 
                              fontWeight="bold" 
                              fontSize="lg"
                              isTruncated
                              maxW="200px"
                            >
                              {token.symbol}
                            </Text>
                          </Tooltip>
                          <Text 
                            fontSize="sm" 
                            color="gray.600"
                            isTruncated
                            maxW="200px"
                          >
                            {token.name}
                          </Text>
                          <Text 
                            fontSize="xl" 
                            color="blue.600"
                            fontWeight="semibold"
                          >
                            {token.balance}
                          </Text>
                          <Text fontSize="xs" color="gray.400">
                            Decimals: {token.decimals}
                          </Text>
                        </VStack>
                      </HStack>
                    </CardBody>
                  </Card>
                ))}
              </SimpleGrid>
            )}
          </Box>
        )}

        <Text fontSize="sm" color="gray.500" textAlign="center" pt={10}>
          💡 Tip: You can enter ENS names like "vitalik.eth" or regular addresses!
          <br />
          Click any token to view on Etherscan
        </Text>
      </VStack>
    </Container>
  );
}

export default App;
