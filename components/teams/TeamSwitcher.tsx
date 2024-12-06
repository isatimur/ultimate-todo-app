import { Check, ChevronsUpDown, PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Team } from "@/types/team";
import { useState } from "react";
import CreateTeamDialog from "./create-team-dialog";

interface TeamSwitcherProps {
    teams: Team[];
    currentTeam: Team | null;
    onTeamChange: (team: Team) => void;
    onCreateTeam: (name: string, description: string) => Promise<void>;
}

export default function TeamSwitcher({ 
    teams, 
    currentTeam, 
    onTeamChange,
    onCreateTeam 
}: TeamSwitcherProps) {
    const [open, setOpen] = useState(false);
    const [showCreateDialog, setShowCreateDialog] = useState(false);

    return (
        <div className="flex items-center gap-4">
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        aria-label="Select a team"
                        className="w-[200px] justify-between"
                    >
                        {currentTeam ? (
                            <div className="flex items-center gap-2">
                                <Avatar className="h-5 w-5">
                                    <AvatarImage
                                        src={`https://avatar.vercel.sh/${currentTeam.id}.png`}
                                        alt={currentTeam.name}
                                    />
                                    <AvatarFallback>{currentTeam.name[0]}</AvatarFallback>
                                </Avatar>
                                <span className="truncate">{currentTeam.name}</span>
                            </div>
                        ) : (
                            "Select a team"
                        )}
                        <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-0">
                    <Command>
                        <CommandList>
                            <CommandInput placeholder="Search team..." />
                            <CommandEmpty>No team found.</CommandEmpty>
                            <CommandGroup heading="Teams">
                                {teams.map((team) => (
                                    <CommandItem
                                        key={team.id}
                                        onSelect={() => {
                                            onTeamChange(team);
                                            setOpen(false);
                                        }}
                                        className="text-sm"
                                    >
                                        <Avatar className="mr-2 h-5 w-5">
                                            <AvatarImage
                                                src={`https://avatar.vercel.sh/${team.id}.png`}
                                                alt={team.name}
                                            />
                                            <AvatarFallback>{team.name[0]}</AvatarFallback>
                                        </Avatar>
                                        {team.name}
                                        <Check
                                            className={cn(
                                                "ml-auto h-4 w-4",
                                                currentTeam?.id === team.id
                                                    ? "opacity-100"
                                                    : "opacity-0"
                                            )}
                                        />
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                        <CommandSeparator />
                        <CommandList>
                            <CommandGroup>
                                <CommandItem
                                    onSelect={() => {
                                        setShowCreateDialog(true);
                                        setOpen(false);
                                    }}
                                >
                                    <PlusCircle className="mr-2 h-5 w-5" />
                                    Create Team
                                </CommandItem>
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>

            <CreateTeamDialog
                open={showCreateDialog}
                onOpenChange={setShowCreateDialog}
                onCreateTeam={onCreateTeam}
            />
        </div>
    );
}