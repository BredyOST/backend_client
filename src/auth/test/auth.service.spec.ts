import { Test, TestingModule } from '@nestjs/testing'
import { AuthService } from '../auth.service'
import { UsersService } from '../../users/users.service'
import { JwtService } from '@nestjs/jwt'
import { SessionAuthService } from '../session-auth/session-auth.service'
import { LogsServiceOtherErrors } from '../../otherServices/loggerService/logger.service'
import { AuthorizationsService } from '../../additionalRepositories/authorizations/authorizations.service'
import { MailerService } from '@nestjs-modules/mailer'

const userInfo = {
  id: 1,
  email: 'test@example.com',
  forChangeEmail: '',
  phoneNumber: '+79292642644',
  forChangePhoneNumber: '',
  password: 'asdasd!@Sfd',
  fullName: '',
  isAdmin: false,
  isMainAdmin: false,
  isActivatedEmail: false,
  isActivatedPhone: false,
  activatedFreePeriod: false,
  endFreePeriod: false,
  activatedFreePeriodNotification: false,
  endFreePeriodNotification: false,
  sessionToken: '',
  ip: '',
  activationLink: '',
  activationNumber: '',
  categoriesFreePeriod: [],
  notificationsFreePeriod: [],
  categoriesHasBought: [],
  timeCallVerify: new Date('2023-11-03T22:50:03.585Z'),
  createdAt: new Date('2023-11-03T22:50:03.585Z'),
  updateAt: new Date('2023-11-03T22:50:03.585Z'),
  deletedAt: new Date('2023-11-03T22:50:03.585Z'),
};

describe('AuthService', () => {
  let authService: AuthService
  let usersService: UsersService
  let jwtService: JwtService
  let sessionAuthService: SessionAuthService
  let logsServiceOtherErrors: LogsServiceOtherErrors
  let authorizationsService: AuthorizationsService
  let mailerService: MailerService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            findByEmail: jest.fn(),
            findByPhone: jest.fn(),
            findByChangePhone: jest.fn(),
            findById: jest.fn(),
            findByActivateLink: jest.fn(),
            create: jest.fn(),
            getProfileInfo: jest.fn(),
            saveUpdatedUser: jest.fn(),
            updateEmailСode: jest.fn(),
            updateEmail: jest.fn(),
            updateFullName: jest.fn(),
            updatePhone: jest.fn(),
            updatePassword: jest.fn(),
            sendActivationMail: jest.fn(),
            sendMessageAboutActivated: jest.fn(),
            sendActivationCodeForNewEmail: jest.fn(),
            sendChangePassword: jest.fn(),
            randomPassword: jest.fn(),
            verifyPhoneNumber: jest.fn(),
            verifyPhoneCode: jest.fn(),
            changePassword: jest.fn(),
            activate: jest.fn(),
            activateRepeat: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
          },
        },
        {
          provide: SessionAuthService,
          useValue: {
            createToken: jest.fn(),
            validateSessionToken: jest.fn(),
          },
        },
        {
          provide: LogsServiceOtherErrors,
          useValue: {
            log: jest.fn(),
            error: jest.fn(),
          },
        },
        {
          provide: AuthorizationsService,
          useValue: {
            create: jest.fn(),
            findLastSessionByUserId: jest.fn(),
            findLastSessionByUserIdAndMonth: jest.fn(),
            updateAuthorization: jest.fn(),
            getMyAuthorizations: jest.fn(),
          },
        },
        {
          provide: MailerService,
          useValue: {
          },
        },
      ],
    }).compile()

    authService = module.get<AuthService>(AuthService)
    usersService = module.get<UsersService>(UsersService)
    jwtService = module.get<JwtService>(JwtService)
    sessionAuthService = module.get<SessionAuthService>(SessionAuthService)
    logsServiceOtherErrors = module.get<LogsServiceOtherErrors>(LogsServiceOtherErrors)
    authorizationsService = module.get<AuthorizationsService>(AuthorizationsService)
    mailerService = module.get<MailerService>(MailerService)
  })

  describe('AuthService.register', () => {
    // Данные для успешной регистрации
    const createUserDto = {
      email: 'newuser@example.com',
      password: 'Password123',
      passwordCheck: 'Password123',
    };

    it('создание пользователя', async () => {
      jest.spyOn(usersService, 'findByEmail').mockResolvedValueOnce(null);
      jest.spyOn(usersService, 'create').mockImplementation(async () => ({
        ...userInfo,
        id: 1,
        email: createUserDto.email,
        activationLink: 'activation-link',
        password: createUserDto.password,
      }));
      jest.spyOn(usersService, 'sendActivationMail').mockResolvedValueOnce(undefined);

      const result = await authService.register(createUserDto);

      expect(result.text).toContain('Регистрация завершена');
    });

    it('не совпадают пароли', async () => {
      const mismatchDto = { ...createUserDto, passwordCheck: 'Password123' };
      await expect(authService.register(mismatchDto)).rejects.toThrow('Проверьте введенные пароли');
    });

    it('пароли совпадают', async () => {
      const matchingDto = { ...createUserDto, passwordCheck: 'Password123' };
      const result = await authService.register(matchingDto);
      expect(result.text).toContain('Регистрация завершена');
    });

    it('пользователь с таким email уже существует', async () => {
      jest.spyOn(usersService, 'findByEmail').mockResolvedValueOnce(userInfo);

      await expect(authService.register(createUserDto)).rejects.toThrow('Пользователь с таким email уже зарегистрирован');
    });

    it('ошибка при создании пользователя', async () => {
      jest.spyOn(usersService, 'findByEmail').mockResolvedValueOnce(null);
      jest.spyOn(usersService, 'create').mockRejectedValueOnce(new Error('Ошибка при создании пользователя'));

      await expect(authService.register(createUserDto)).rejects.toThrow('Ошибка при создании пользователя');
    });

  });
})
