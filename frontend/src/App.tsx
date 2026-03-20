import { Toaster } from "@/components/ui/sonner";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import { useActor } from "./hooks/useActor";
import { useMyProfile } from "./hooks/useQueries";
import { LoadingScreen } from "./components/LoadingScreen";
import { LandingPage } from "./components/LandingPage";
import { ProfileSetup } from "./components/profile/ProfileSetup";
import { MainApp } from "./components/MainApp";

function AuthenticatedApp() {
  const { isFetching: isActorLoading } = useActor();
  const { data: profile, isLoading: isProfileLoading } = useMyProfile();

  if (isActorLoading || isProfileLoading) {
    return <LoadingScreen message="Loading..." />;
  }

  const hasProfile = profile !== null && profile !== undefined;

  if (!hasProfile) {
    return <ProfileSetup />;
  }

  return <MainApp />;
}

const App = () => {
  const { isInitializing, identity, login } = useInternetIdentity();
  const isAuthenticated = !!identity;

  if (isInitializing) {
    return <LoadingScreen message="Loading..." />;
  }

  return (
    <>
      {!isAuthenticated && <LandingPage onLogin={login} />}
      {isAuthenticated && <AuthenticatedApp />}
      <Toaster position="bottom-right" />
    </>
  );
};

export default App;
